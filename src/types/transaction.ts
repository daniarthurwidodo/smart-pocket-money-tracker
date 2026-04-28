export interface Transaction {
  id: number;
  pocketId: number;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  pocketId: number;
  amount: number;
  type: 'income' | 'expense';
  category?: string | null;
  description?: string | null;
  date?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  type?: 'income' | 'expense';
  category?: string | null;
  description?: string | null;
  date?: string;
}
