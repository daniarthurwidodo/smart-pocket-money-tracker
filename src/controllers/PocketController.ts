import { PocketService } from '../services/PocketService';
import {
  ApiResponse,
  ApiListResponse,
  ApiListSuccessResponse,
  CreatePocketInput,
  UpdatePocketInput,
  Pocket,
} from '../types/pocket';

interface RequestBody {
  name?: string;
  balance?: number;
  currency?: string;
  description?: string;
  isActive?: boolean;
}

export class PocketController {
  private readonly pocketService: PocketService;

  constructor() {
    this.pocketService = new PocketService();
  }

  async getAll(activeOnly?: boolean): Promise<ApiListResponse<Pocket>> {
    try {
      const pockets = await this.pocketService.getAll(activeOnly);
      const response: ApiListSuccessResponse<Pocket> = {
        success: true,
        data: pockets,
        total: pockets.length,
      };
      return response;
    } catch (error) {
      console.error('PocketController.getAll error:', error);
      return {
        success: false,
        error: 'Failed to fetch pockets',
      };
    }
  }

  async getById(id: number): Promise<ApiResponse<Pocket>> {
    try {
      const pocket = await this.pocketService.getById(id);

      if (!pocket) {
        return {
          success: false,
          error: 'Pocket not found',
        };
      }

      return {
        success: true,
        data: pocket,
      };
    } catch (error) {
      console.error('PocketController.getById error:', error);
      return {
        success: false,
        error: 'Failed to fetch pocket',
      };
    }
  }

  async create(input: CreatePocketInput): Promise<ApiResponse<Pocket>> {
    try {
      const errors = this.validateCreateInput(input);

      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join(', '),
        };
      }

      const pocket = await this.pocketService.create(input);
      return {
        success: true,
        data: pocket,
      };
    } catch (error) {
      console.error('PocketController.create error:', error);
      return {
        success: false,
        error: 'Failed to create pocket',
      };
    }
  }

  async update(id: number, input: UpdatePocketInput): Promise<ApiResponse<Pocket>> {
    try {
      const errors = this.validateUpdateInput(input);

      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join(', '),
        };
      }

      const pocket = await this.pocketService.update(id, input);

      if (!pocket) {
        return {
          success: false,
          error: 'Pocket not found',
        };
      }

      return {
        success: true,
        data: pocket,
      };
    } catch (error) {
      console.error('PocketController.update error:', error);
      return {
        success: false,
        error: 'Failed to update pocket',
      };
    }
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const deleted = await this.pocketService.delete(id);

      if (!deleted) {
        return {
          success: false,
          error: 'Pocket not found',
        };
      }

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      console.error('PocketController.delete error:', error);
      return {
        success: false,
        error: 'Failed to delete pocket',
      };
    }
  }

  private validateCreateInput(input: RequestBody): string[] {
    const errors: string[] = [];

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (input.name && input.name.length > 100) {
      errors.push('Name must not exceed 100 characters');
    }

    if (input.balance !== undefined && (typeof input.balance !== 'number' || input.balance < 0)) {
      errors.push('Balance must be a non-negative number');
    }

    if (input.currency && !/^[A-Z]{3}$/.test(input.currency)) {
      errors.push('Currency must be a 3-letter ISO code');
    }

    return errors;
  }

  private validateUpdateInput(input: RequestBody): string[] {
    const errors: string[] = [];

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        errors.push('Name cannot be empty');
      } else if (input.name.length > 100) {
        errors.push('Name must not exceed 100 characters');
      }
    }

    if (input.balance !== undefined && (typeof input.balance !== 'number' || input.balance < 0)) {
      errors.push('Balance must be a non-negative number');
    }

    if (input.currency && !/^[A-Z]{3}$/.test(input.currency)) {
      errors.push('Currency must be a 3-letter ISO code');
    }

    return errors;
  }
}
