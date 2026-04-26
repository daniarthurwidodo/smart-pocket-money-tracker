import { PocketController } from './PocketController';
import { TransactionService } from '../services/TransactionService';
import { ApiResponse, ApiListResponse } from '../types/pocket';
import { CreateTransactionInput, UpdateTransactionInput, Transaction } from '../types/transaction';

export class MITAppInventorController {
  private readonly pocketController: PocketController;
  private readonly transactionService: TransactionService;

  constructor() {
    this.pocketController = new PocketController();
    this.transactionService = new TransactionService();
  }

  async listTransactions(pocketId?: number): Promise<ApiListResponse<Transaction>> {
    try {
      if (pocketId !== undefined) {
        const pocketResult = await this.pocketController.getById(pocketId);
        if (!pocketResult.success) {
          return {
            success: false,
            error: 'Pocket not found',
          };
        }
      }

      const transactions = await this.transactionService.getAll(pocketId);
      return {
        success: true,
        data: transactions,
        total: transactions.length,
      };
    } catch (error) {
      console.error('MITAppInventorController.listTransactions error:', error);
      return {
        success: false,
        error: 'Failed to fetch transactions',
      };
    }
  }

  async getTransaction(id: number): Promise<ApiResponse<Transaction>> {
    try {
      const transaction = await this.transactionService.getById(id);

      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      console.error('MITAppInventorController.getTransaction error:', error);
      return {
        success: false,
        error: 'Failed to fetch transaction',
      };
    }
  }

  async createTransaction(input: CreateTransactionInput): Promise<ApiResponse<Transaction>> {
    try {
      const errors = this.validateCreateInput(input);

      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join(', '),
        };
      }

      const pocketResult = await this.pocketController.getById(input.pocketId);
      if (!pocketResult.success) {
        return {
          success: false,
          error: 'Invalid pocket_id: pocket not found',
        };
      }

      const transaction = await this.transactionService.create(input);
      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      console.error('MITAppInventorController.createTransaction error:', error);
      return {
        success: false,
        error: 'Failed to create transaction',
      };
    }
  }

  async updateTransaction(id: number, input: UpdateTransactionInput): Promise<ApiResponse<Transaction>> {
    try {
      const errors = this.validateUpdateInput(input);

      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join(', '),
        };
      }

      const transaction = await this.transactionService.update(id, input);

      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      console.error('MITAppInventorController.updateTransaction error:', error);
      return {
        success: false,
        error: 'Failed to update transaction',
      };
    }
  }

  async deleteTransaction(id: number): Promise<ApiResponse<null>> {
    try {
      const deleted = await this.transactionService.delete(id);

      if (!deleted) {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      console.error('MITAppInventorController.deleteTransaction error:', error);
      return {
        success: false,
        error: 'Failed to delete transaction',
      };
    }
  }

  private validateCreateInput(input: CreateTransactionInput): string[] {
    const errors: string[] = [];

    if (!input.pocketId || typeof input.pocketId !== 'number' || isNaN(input.pocketId)) {
      errors.push('pocketId must be a valid number');
    }

    if (typeof input.amount !== 'number' || input.amount <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (input.type !== 'income' && input.type !== 'expense') {
      errors.push('Type must be "income" or "expense"');
    }

    if (input.category !== undefined && input.category !== null && input.category.length > 50) {
      errors.push('Category must not exceed 50 characters');
    }

    if (input.date !== undefined && input.date !== null) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(input.date)) {
        errors.push('Date must be in YYYY-MM-DD format');
      }
    }

    return errors;
  }

  private validateUpdateInput(input: UpdateTransactionInput): string[] {
    const errors: string[] = [];

    if (input.amount !== undefined && (typeof input.amount !== 'number' || input.amount <= 0)) {
      errors.push('Amount must be a positive number');
    }

    if (input.type !== undefined && input.type !== 'income' && input.type !== 'expense') {
      errors.push('Type must be "income" or "expense"');
    }

    if (input.category !== undefined && input.category !== null && input.category.length > 50) {
      errors.push('Category must not exceed 50 characters');
    }

    if (input.date !== undefined && input.date !== null) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(input.date)) {
        errors.push('Date must be in YYYY-MM-DD format');
      }
    }

    return errors;
  }
}
