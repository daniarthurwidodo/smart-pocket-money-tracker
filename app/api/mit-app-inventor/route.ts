import { NextRequest, NextResponse } from 'next/server';
import { MITAppInventorController } from '../../../src/controllers/MITAppInventorController';
import {
  successResponse,
  errorResponse,
  withErrorHandler,
  badRequestResponse,
  notFoundResponse,
} from '../../../src/lib/api-response';
import { CreateTransactionInput, UpdateTransactionInput } from '../../../src/types/transaction';

const controller = new MITAppInventorController();

const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'delete'] as const;
type Action = typeof VALID_ACTIONS[number];

async function parseBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get('content-type') ?? '';
  const rawBody = await request.text();

  console.log('[MIT App Inventor] Content-Type:', contentType);
  console.log('[MIT App Inventor] Raw body:', rawBody);

  if (!rawBody || rawBody.trim().length === 0) {
    console.warn('[MIT App Inventor] Empty request body');
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
      console.log('[MIT App Inventor] Parsed form data:', result);
      return result;
    }

    console.warn('[MIT App Inventor] Could not parse body in any format');
    return null;
  }
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const action = (searchParams.get('action') ?? 'list') as Action;
  const resourceId = searchParams.get('id');
  const pocketId = searchParams.get('pocket_id');

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

      if (!body || typeof body !== 'object') {
        return badRequestResponse('Request body must be a JSON object');
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
  }
}

export async function GET(request: NextRequest) {
  return withErrorHandler(() => handleRequest(request), 'MIT App Inventor GET error');
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
