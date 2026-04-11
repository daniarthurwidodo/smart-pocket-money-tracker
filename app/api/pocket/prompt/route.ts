import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterClient, PocketData } from '../../../src/lib/openrouter';
import { PocketController } from '../../../src/controllers/PocketController';

const openRouterClient = new OpenRouterClient();
const pocketController = new PocketController();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const parsedData: PocketData | null = await openRouterClient.parsePocketPrompt(prompt);

    if (!parsedData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not understand your request. Please provide more details about the pocket you want to create.',
        },
        { status: 400 }
      );
    }

    let result;

    switch (parsedData.action) {
      case 'create': {
        if (!parsedData.pocket?.name) {
          return NextResponse.json(
            { success: false, error: 'Pocket name is required' },
            { status: 400 }
          );
        }

        result = await pocketController.create({
          name: parsedData.pocket.name,
          balance: parsedData.pocket.balance,
          currency: parsedData.pocket.currency,
          description: parsedData.pocket.description,
          date: parsedData.pocket.date,
          isActive: parsedData.pocket.isActive,
        });
        break;
      }

      case 'update': {
        if (!parsedData.id) {
          return NextResponse.json(
            { success: false, error: 'Pocket ID is required for update' },
            { status: 400 }
          );
        }

        if (!parsedData.pocket) {
          return NextResponse.json(
            { success: false, error: 'No update data provided' },
            { status: 400 }
          );
        }

        result = await pocketController.update(parsedData.id, parsedData.pocket);
        break;
      }

      case 'delete': {
        if (!parsedData.id) {
          return NextResponse.json(
            { success: false, error: 'Pocket ID is required for delete' },
            { status: 400 }
          );
        }

        result = await pocketController.delete(parsedData.id);
        break;
      }

      case 'list': {
        const activeOnly = parsedData.pocket?.isActive !== undefined ? parsedData.pocket.isActive : undefined;
        result = await pocketController.getAll(activeOnly);
        break;
      }

      default: {
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      ...result,
      action: parsedData.action,
    });
  } catch (error) {
    console.error('API POST /pocket/prompt error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
