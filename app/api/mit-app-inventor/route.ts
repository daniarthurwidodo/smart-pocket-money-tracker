import { NextRequest, NextResponse } from 'next/server';
import { MITAppInventorController } from '../../../src/controllers/MITAppInventorController';
import {
  successResponse,
  errorResponse,
  withErrorHandler,
  withRetry,
  badRequestResponse,
  notFoundResponse,
} from '../../../src/lib/api-response';
import { CreateTransactionInput, UpdateTransactionInput } from '../../../src/types/transaction';
import { handleMITCreate } from '../../../src/lib/mit-transaction';
import { OpenRouterClient } from '../../../src/lib/openrouter';

const controller = new MITAppInventorController();

const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'delete', 'history'] as const;
type Action = typeof VALID_ACTIONS[number];

async function parseBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const rawBody = await request.text();

  if (!rawBody || rawBody.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawBody);
    return parsed;
  } catch {
    console.warn('[MIT App Inventor] Failed to parse body as JSON, trying form data');
    // Try parsing as form-encoded data
    const params = new URLSearchParams(rawBody);
    const result: Record<string, unknown> = {};

    if (params.size > 0) {
      for (const [key, value] of params.entries()) {
        if (key === 'pocketId' || key === 'amount') {
          result[key] = Number(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
    return null;
  }
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const action = (searchParams.get('action') ?? 'list') as Action;
  const resourceId = searchParams.get('id');
  const pocketId = searchParams.get('pocket_id');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  if (!VALID_ACTIONS.includes(action)) {
    return badRequestResponse(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }

  let parsedId: number | undefined;
  if (action === 'get' || action === 'update' || action === 'delete') {
    if (!resourceId) {
      return badRequestResponse('id parameter is required');
    }
    parsedId = parseInt(resourceId, 10);
    if (isNaN(parsedId)) {
      return badRequestResponse('Invalid id parameter');
    }
  }

  let parsedPocketId: number | undefined;
  if (pocketId) {
    parsedPocketId = parseInt(pocketId, 10);
    if (isNaN(parsedPocketId)) {
      return badRequestResponse('Invalid pocket_id parameter');
    }
  }

  switch (action) {
    case 'list': {
      const result = await controller.listTransactions(parsedPocketId);
      if (!result.success) {
        return errorResponse(result.error, { status: 500 });
      }
      return successResponse(result.data, { total: result.total });
    }

    case 'get': {
      const result = await controller.getTransaction(parsedId!);
      if (!result.success) {
        return notFoundResponse(result.error);
      }
      return successResponse(result.data);
    }

    case 'create': {
      const body = await parseBody(request);
      console.log(`[MIT App Inventor] Create body: ${JSON.stringify(body)}`);

      // Handle MIT App Inventor format: { pengeluaran, pemasukan, tanggal }
      if (body && typeof body === 'object') {
        const mitBody = body as Record<string, unknown>;
        if ('pengeluaran' in mitBody || 'pemasukan' in mitBody || 'tanggal' in mitBody) {
          const results = await handleMITCreate(body as Record<string, unknown>);
          if (!results.success) {
            return errorResponse(results.error, { status: 400 });
          }
          return successResponse(results.data, {
            status: 201,
            message: 'Transaction created successfully',
          });
        }
      }

      // Handle string prompt — route through AI parser
      if (typeof body === 'string') {
        const prompt = body;
        console.log(`[MIT App Inventor] Processing AI prompt: ${prompt}`);

        const openrouter = new OpenRouterClient();
        const parsed = await openrouter.parsePocketPrompt(prompt);
        console.log(`[MIT App Inventor] Parsed: ${JSON.stringify(parsed)}`);

        if (!parsed.parsedData) {
          return errorResponse('Could not parse prompt. Please use format like: "simpan 123 hari ini" or provide JSON.', { status: 400 });
        }

        // Handle create_transaction action
        if (parsed.parsedData.action === 'create_transaction' && parsed.parsedData.transaction) {
          const result = await handleMITCreate({
            pemasukan: parsed.parsedData.transaction.pemasukan ?? 0,
            pengeluaran: parsed.parsedData.transaction.pengeluaran ?? 0,
            tanggal: parsed.parsedData.transaction.tanggal,
          } as Record<string, unknown>);

          if (!result.success) {
            return errorResponse(`Failed to create transaction: ${result.error}`, { status: 400 });
          }
          return successResponse(result.data, {
            status: 201,
            message: 'Transaction created successfully via AI',
          });
        }

        return errorResponse(`Unsupported AI action: ${parsed.parsedData.action}. Use this endpoint for create_transaction only.`, { status: 400 });
      }

      const input: CreateTransactionInput = {
        pocketId: body.pocketId as number,
        amount: body.amount as number,
        type: body.type as 'income' | 'expense',
        category: body.category as string | null | undefined,
        description: body.description as string | null | undefined,
        date: body.date as string | undefined,
      };

      const result = await controller.createTransaction(input);
      if (!result.success) {
        console.error('[MIT App Inventor] Create validation error:', result.error, 'Body:', JSON.stringify(body));
        return errorResponse(result.error, { status: 400 });
      }

      return successResponse(result.data, {
        status: 201,
        message: 'Transaction created successfully',
      });
    }

    case 'update': {
      const body = await parseBody(request);

      if (!body || typeof body !== 'object') {
        return badRequestResponse('Request body must be a JSON object');
      }

      const input: UpdateTransactionInput = {
        amount: body.amount as number | undefined,
        type: body.type as 'income' | 'expense' | undefined,
        category: body.category as string | null | undefined,
        description: body.description as string | null | undefined,
        date: body.date as string | undefined,
      };

      const result = await controller.updateTransaction(parsedId!, input);
      if (!result.success) {
        console.error('[MIT App Inventor] Update validation error:', result.error, 'Body:', JSON.stringify(body));
        return notFoundResponse(result.error);
      }

      return successResponse(result.data, {
        message: 'Transaction updated successfully',
      });
    }

    case 'delete': {
      const result = await controller.deleteTransaction(parsedId!);
      if (!result.success) {
        return notFoundResponse(result.error);
      }

      return successResponse(null, {
        message: 'Transaction deleted successfully',
      });
    }

    case 'history': {
      const result = await controller.getHistory(parsedPocketId, dateFrom, dateTo);
      if (!result.success) {
        return errorResponse(result.error, { status: 500 });
      }
      return successResponse(result.data, { total: result.total });
    }
  }
}

export async function GET(request: NextRequest) {
  return withRetry(
    () => withErrorHandler(() => handleRequest(request), 'MIT App Inventor GET error'),
    'MIT App Inventor GET'
  );
}

export async function POST(request: NextRequest) {
  return withErrorHandler(() => handleRequest(request), 'MIT App Inventor POST error');
}

export async function PUT(request: NextRequest) {
  return withErrorHandler(() => handleRequest(request), 'MIT App Inventor PUT error');
}

export async function DELETE(request: NextRequest) {
  return withErrorHandler(() => handleRequest(request), 'MIT App Inventor DELETE error');
}
