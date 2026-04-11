import { NextRequest, NextResponse } from 'next/server';
import { PocketController } from '../../../src/controllers/PocketController';
import { CreatePocketInput } from '../../../src/types/pocket';

const controller = new PocketController();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';

    const result = await controller.getAll(activeOnly);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API GET /pocket error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input: CreatePocketInput = {
      name: body.name,
      balance: body.balance,
      currency: body.currency,
      description: body.description,
      date: body.date,
      isActive: body.isActive,
    };

    const result = await controller.create(input);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('API POST /pocket error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
