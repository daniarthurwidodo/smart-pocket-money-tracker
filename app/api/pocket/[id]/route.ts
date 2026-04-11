import { NextRequest } from 'next/server';
import { PocketController } from '../../../../src/controllers/PocketController';
import {
  successResponse,
  withErrorHandler,
  badRequestResponse,
  notFoundResponse,
} from '../../../../src/lib/api-response';
import { UpdatePocketInput } from '../../../../src/types/pocket';

const controller = new PocketController();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return badRequestResponse('Invalid pocket ID');
    }

    const result = await controller.getById(parsedId);

    if (!result.success) {
      return notFoundResponse(result.error);
    }

    return successResponse(result.data);
  }, 'API GET /pocket/:id error');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return badRequestResponse('Invalid pocket ID');
    }

    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return badRequestResponse('Request body must be a JSON object');
    }

    const input: UpdatePocketInput = {
      name: body.name,
      balance: body.balance,
      currency: body.currency,
      description: body.description,
      date: body.date,
      isActive: body.isActive,
    };

    const result = await controller.update(parsedId, input);

    if (!result.success) {
      return notFoundResponse(result.error);
    }

    return successResponse(result.data, {
      message: 'Pocket updated successfully',
    });
  }, 'API PUT /pocket/:id error');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return badRequestResponse('Invalid pocket ID');
    }

    const result = await controller.delete(parsedId);

    if (!result.success) {
      return notFoundResponse(result.error);
    }

    return successResponse(null, {
      message: 'Pocket deleted successfully',
    });
  }, 'API DELETE /pocket/:id error');
}
