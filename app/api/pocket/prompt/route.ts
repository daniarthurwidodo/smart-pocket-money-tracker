import { NextRequest } from 'next/server';
import { OpenRouterClient, PocketData, ParsePocketPromptResult } from '../../../../src/lib/openrouter';
import { PocketController } from '../../../../src/controllers/PocketController';
import { handleMITCreate } from '../../../../src/lib/mit-transaction';
import {
  successResponse,
  errorResponse,
  withErrorHandler,
  badRequestResponse,
} from '../../../../src/lib/api-response';

const openRouterClient = new OpenRouterClient();
const pocketController = new PocketController();

export async function POST(request: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const startTime = Date.now();

  return withErrorHandler(async () => {
    let rawBody: unknown;
    let promptValue: string | undefined;

    try {
      rawBody = await request.json();
    } catch (parseError) {
      console.error(`[PromptAPI:${requestId}] Failed to parse request body:`, parseError);
      return badRequestResponse('Invalid JSON format');
    }

    if (!rawBody || typeof rawBody !== 'object') {
      console.error(`[PromptAPI:${requestId}] Invalid request body type:`, typeof rawBody);
      return badRequestResponse('Request body must be a JSON object');
    }

    const { prompt } = rawBody as { prompt?: unknown };
    promptValue = prompt as string | undefined;

    if (!promptValue || typeof promptValue !== 'string' || promptValue.trim().length === 0) {
      console.error(`[PromptAPI:${requestId}] Validation failed - prompt:`, {
        prompt: promptValue,
        promptType: typeof promptValue,
        promptLength: promptValue?.length,
      });
      return badRequestResponse('Prompt is required and must be a non-empty string');
    }

    console.log(`[PromptAPI:${requestId}] Processing prompt: "${promptValue.substring(0, 100)}${promptValue.length > 100 ? '...' : ''}"`);

    let parseResult: ParsePocketPromptResult;

    try {
      parseResult = await openRouterClient.parsePocketPrompt(promptValue);
      console.log(`[PromptAPI:${requestId}] OpenRouter response:`, JSON.stringify(parseResult.parsedData));
    } catch (openRouterError) {
      const elapsed = Date.now() - startTime;
      console.error(`[PromptAPI:${requestId}] OpenRouter API error after ${elapsed}ms:`, {
        error: openRouterError instanceof Error ? openRouterError.message : String(openRouterError),
        errorName: openRouterError instanceof Error ? openRouterError.name : 'Unknown',
        stack: openRouterError instanceof Error ? openRouterError.stack : undefined,
        prompt: promptValue.substring(0, 200),
      });

      if (openRouterError instanceof Error && openRouterError.name === 'AbortError') {
        return errorResponse('AI request timed out. Please try again.', { status: 504 });
      }

      return errorResponse('Failed to process prompt with AI', { status: 502 });
    }

    if (!parseResult.parsedData) {
      console.error(`[PromptAPI:${requestId}] OpenRouter returned null/undefined - could not parse prompt:`, {
        prompt: promptValue.substring(0, 200),
        modelUsed: parseResult.modelUsed,
      });
      return errorResponse(
        'Could not understand your request. Please provide more details about the pocket you want to create.',
        { status: 400 }
      );
    }

    const parsedData = parseResult.parsedData;

    let result;
    let actionMessage: string;

    switch (parsedData.action) {
      case 'create': {
        console.log(`[PromptAPI:${requestId}] Creating pocket:`, JSON.stringify(parsedData.pocket));
        result = await pocketController.create({
          name: parsedData.pocket?.name ?? null,
          balance: parsedData.pocket?.balance,
          currency: parsedData.pocket?.currency,
          description: parsedData.pocket?.description,
          targetDate: parsedData.pocket?.targetDate,
          isActive: parsedData.pocket?.isActive,
        });

        if (!result.success) {
          console.error(`[PromptAPI:${requestId}] Create pocket failed:`, {
            inputData: JSON.stringify(parsedData.pocket),
            error: result.error,
          });
          return errorResponse(result.error, { status: 400 });
        }

        actionMessage = 'Pocket created successfully via AI';
        break;
      }

      case 'update': {
        if (!parsedData.id) {
          console.error(`[PromptAPI:${requestId}] Update action missing ID:`, JSON.stringify(parsedData));
          return badRequestResponse('Pocket ID is required for update');
        }

        if (!parsedData.pocket) {
          console.error(`[PromptAPI:${requestId}] Update action missing pocket data:`, JSON.stringify(parsedData));
          return badRequestResponse('No update data provided');
        }

        console.log(`[PromptAPI:${requestId}] Updating pocket ${parsedData.id}:`, JSON.stringify(parsedData.pocket));
        result = await pocketController.update(parsedData.id, {
          name: parsedData.pocket.name,
          balance: parsedData.pocket.balance,
          currency: parsedData.pocket.currency,
          description: parsedData.pocket.description,
          targetDate: parsedData.pocket.targetDate,
          isActive: parsedData.pocket.isActive,
        });

        if (!result.success) {
          console.error(`[PromptAPI:${requestId}] Update pocket failed:`, {
            id: parsedData.id,
            inputData: JSON.stringify(parsedData.pocket),
            error: result.error,
          });
          return errorResponse(result.error, { status: 404 });
        }

        actionMessage = 'Pocket updated successfully via AI';
        break;
      }

      case 'delete': {
        if (!parsedData.id) {
          console.error(`[PromptAPI:${requestId}] Delete action missing ID:`, JSON.stringify(parsedData));
          return badRequestResponse('Pocket ID is required for delete');
        }

        console.log(`[PromptAPI:${requestId}] Deleting pocket ${parsedData.id}`);
        result = await pocketController.delete(parsedData.id);

        if (!result.success) {
          console.error(`[PromptAPI:${requestId}] Delete pocket failed:`, {
            id: parsedData.id,
            error: result.error,
          });
          return errorResponse(result.error, { status: 404 });
        }

        actionMessage = 'Pocket deleted successfully via AI';
        break;
      }

      case 'list': {
        const activeOnly = parsedData.pocket?.isActive !== undefined
          ? parsedData.pocket.isActive
          : undefined;

        console.log(`[PromptAPI:${requestId}] Listing pockets (activeOnly: ${activeOnly})`);
        result = await pocketController.getAll(activeOnly);

        if (!result.success) {
          console.error(`[PromptAPI:${requestId}] List pockets failed:`, {
            activeOnly,
            error: result.error,
          });
          return errorResponse(result.error, { status: 500 });
        }

        actionMessage = 'Pockets retrieved successfully via AI';
        break;
      }

      case 'create_transaction': {
        if (!parsedData.transaction) {
          console.error(`[PromptAPI:${requestId}] create_transaction missing transaction data:`, JSON.stringify(parsedData));
          return badRequestResponse('Transaction data is required');
        }

        const { pemasukan = 0, pengeluaran = 0, tanggal } = parsedData.transaction;

        if (!tanggal) {
          return badRequestResponse('tanggal (date) is required for transaction');
        }

        console.log(`[PromptAPI:${requestId}] Creating transaction:`, JSON.stringify(parsedData.transaction));

        const transactionResult = await handleMITCreate({
          pemasukan: String(pemasukan ?? 0),
          pengeluaran: String(pengeluaran ?? 0),
          tanggal,
        });

        if (!transactionResult.success) {
          console.error(`[PromptAPI:${requestId}] Create transaction failed:`, {
            inputData: JSON.stringify({ pemasukan, pengeluaran, tanggal }),
            error: transactionResult.error,
          });
          return errorResponse(transactionResult.error, { status: 400 });
        }

        result = transactionResult;
        actionMessage = 'Transaction created successfully via AI';
        break;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[PromptAPI:${requestId}] Success after ${elapsed}ms:`, {
      action: parsedData.action,
      message: actionMessage,
      modelUsed: parseResult.modelUsed,
      fallbackUsed: parseResult.fallbackUsed,
      retryCount: parseResult.retryCount,
    });

    return successResponse(result.data, {
      message: actionMessage,
      total: 'total' in result ? result.total : undefined,
      metadata: {
        action: parsedData.action,
        modelUsed: parseResult.modelUsed,
        fallbackUsed: parseResult.fallbackUsed,
        retryCount: parseResult.retryCount,
      },
    });
  }, 'API POST /pocket/prompt error');
}
