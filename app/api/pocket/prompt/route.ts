import { NextRequest } from 'next/server';
import { OpenRouterClient, PocketData } from '../../../../src/lib/openrouter';
import { PocketController } from '../../../../src/controllers/PocketController';
import {
  successResponse,
  errorResponse,
  withErrorHandler,
  badRequestResponse,
} from '../../../../src/lib/api-response';

const openRouterClient = new OpenRouterClient();
const pocketController = new PocketController();

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return badRequestResponse('Request body must be a JSON object');
    }

    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return badRequestResponse('Prompt is required and must be a non-empty string');
    }

    let parsedData: PocketData | null;

    try {
      parsedData = await openRouterClient.parsePocketPrompt(prompt);
    } catch (openRouterError) {
      console.error('OpenRouter API error:', openRouterError);
      return errorResponse('Failed to process prompt with AI', { status: 502 });
    }

    if (!parsedData) {
      return errorResponse(
        'Could not understand your request. Please provide more details about the pocket you want to create.',
        { status: 400 }
      );
    }

    let result;
    let actionMessage: string;

    switch (parsedData.action) {
      case 'create': {
        if (!parsedData.pocket?.name) {
          return badRequestResponse('Pocket name is required');
        }

        result = await pocketController.create({
          name: parsedData.pocket.name,
          balance: parsedData.pocket.balance,
          currency: parsedData.pocket.currency,
          description: parsedData.pocket.description,
          date: parsedData.pocket.date,
          isActive: parsedData.pocket.isActive,
        });

        if (!result.success) {
          return errorResponse(result.error, { status: 400 });
        }

        actionMessage = 'Pocket created successfully via AI';
        break;
      }

      case 'update': {
        if (!parsedData.id) {
          return badRequestResponse('Pocket ID is required for update');
        }

        if (!parsedData.pocket) {
          return badRequestResponse('No update data provided');
        }

        result = await pocketController.update(parsedData.id, parsedData.pocket);

        if (!result.success) {
          return errorResponse(result.error, { status: 404 });
        }

        actionMessage = 'Pocket updated successfully via AI';
        break;
      }

      case 'delete': {
        if (!parsedData.id) {
          return badRequestResponse('Pocket ID is required for delete');
        }

        result = await pocketController.delete(parsedData.id);

        if (!result.success) {
          return errorResponse(result.error, { status: 404 });
        }

        actionMessage = 'Pocket deleted successfully via AI';
        break;
      }

      case 'list': {
        const activeOnly = parsedData.pocket?.isActive !== undefined
          ? parsedData.pocket.isActive
          : undefined;

        result = await pocketController.getAll(activeOnly);

        if (!result.success) {
          return errorResponse(result.error, { status: 500 });
        }

        actionMessage = 'Pockets retrieved successfully via AI';
        break;
      }

      default: {
        return badRequestResponse('Unknown action');
      }
    }

    return successResponse(result.data, {
      message: actionMessage,
      total: 'total' in result ? result.total : undefined,
      metadata: { action: parsedData.action },
    });
  }, 'API POST /pocket/prompt error');
}
