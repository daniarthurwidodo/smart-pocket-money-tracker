import { NextRequest, NextResponse } from 'next/server';
import { PocketController } from '../../../../src/controllers/PocketController';
import { UpdatePocketInput } from '../../../../src/types/pocket';

const controller = new PocketController();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pocket ID' },
        { status: 400 }
      );
    }

    const result = await controller.getById(parsedId);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API GET /pocket/:id error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pocket ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
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
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API PUT /pocket/:id error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pocket ID' },
        { status: 400 }
      );
    }

    const result = await controller.delete(parsedId);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result, { status: 204 });
  } catch (error) {
    console.error('API DELETE /pocket/:id error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
