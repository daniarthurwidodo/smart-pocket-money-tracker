import { NextRequest } from 'next/server';
import { PocketController } from '../../../src/controllers/PocketController';
import {
  successResponse,
  errorResponse,
  withErrorHandler,
  badRequestResponse,
} from '../../../src/lib/api-response';
import { CreatePocketInput } from '../../../src/types/pocket';

const controller = new PocketController();

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';

    const result = await controller.getAll(activeOnly);

    if (!result.success) {
      return errorResponse(result.error, { status: 500 });
    }

    return successResponse(result.data, { total: result.total });
  }, 'API GET /pocket error');
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return badRequestResponse('Request body must be a JSON object');
    }

    const input: CreatePocketInput = {
      name: body.name,
      balance: body.balance,
      currency: body.currency,
      description: body.description,
      isActive: body.isActive,
    };

    const result = await controller.create(input);

    if (!result.success) {
      return errorResponse(result.error, { status: 400 });
    }

    return successResponse(result.data, {
      status: 201,
      message: 'Pocket created successfully',
    });
  }, 'API POST /pocket error');
}
