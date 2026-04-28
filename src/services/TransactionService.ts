import { getPool } from '../lib/database';
import { Transaction, CreateTransactionInput, UpdateTransactionInput } from '../types/transaction';

export class TransactionService {
  private readonly tableName = 'transactions';

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const pool = getPool();
    const values: unknown[] = [
      input.pocketId,
      input.amount,
      input.type,
      input.category ?? null,
      input.description ?? null,
      input.date,
    ];

    const query = input.date
      ? `INSERT INTO ${this.tableName} (pocket_id, amount, type, category, description, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`
      : `INSERT INTO ${this.tableName} (pocket_id, amount, type, category, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`;

    const result = await pool.query(query, input.date ? values : values.slice(0, 5));
    return this.mapRowToTransaction(result.rows[0]);
  }

  async getById(id: number): Promise<Transaction | null> {
    const pool = getPool();
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTransaction(result.rows[0]);
  }

  async getAll(pocketId?: number): Promise<Transaction[]> {
    const pool = getPool();
    let query = `SELECT * FROM ${this.tableName}`;
    const values: unknown[] = [];

    if (pocketId !== undefined) {
      query += ' WHERE pocket_id = $1';
      values.push(pocketId);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const result = await pool.query(query, values);
    return result.rows.map(row => this.mapRowToTransaction(row));
  }

  async getByDateRange(pocketId: number | undefined, startDate?: string, endDate?: string): Promise<Transaction[]> {
    const pool = getPool();
    const values: unknown[] = [];
    let query = `SELECT * FROM ${this.tableName}`;

    if (startDate && endDate) {
      const conditions: string[] = [];
      conditions.push(`date >= $${values.length + 1} AND date <= $${values.length + 2}`);
      values.push(startDate, endDate);

      if (pocketId !== undefined) {
        conditions.push(`pocket_id = $${values.length + 1}`);
        values.push(pocketId);
      }

      query += ' WHERE ' + conditions.join(' AND ');
    } else if (pocketId !== undefined) {
      query += ` WHERE pocket_id = $1`;
      values.push(pocketId);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const startTime = Date.now();
    const result = await pool.query(query, values);
    console.log(`[TransactionService] Query took ${Date.now() - startTime}ms, rows: ${result.rows.length}`);
    console.log(`[TransactionService] Values: ${JSON.stringify(values)}`);
    console.log(`[TransactionService] Results: ${JSON.stringify(result.rows)}`);
    return result.rows.map(row => this.mapRowToTransaction(row));
  }

  async update(id: number, input: UpdateTransactionInput): Promise<Transaction | null> {
    const pool = getPool();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.amount !== undefined) {
      updates.push(`amount = $${paramIndex++}`);
      values.push(input.amount);
    }

    if (input.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(input.type);
    }

    if (input.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(input.category);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }

    if (input.date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      values.push(input.date);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE ${this.tableName}
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTransaction(result.rows[0]);
  }

  async delete(id: number): Promise<boolean> {
    const pool = getPool();
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await pool.query(query, [id]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  private mapRowToTransaction(row: Record<string, unknown>): Transaction {
    const createdAt = row.created_at as Date;
    const updatedAt = row.updated_at as Date;

    return {
      id: row.id as number,
      pocketId: row.pocket_id as number,
      amount: Number(row.amount as number | string),
      type: row.type as 'income' | 'expense',
      category: row.category as string | null,
      description: row.description as string | null,
      date: row.date as string,
      createdAt: this.toReadableDate(createdAt),
      updatedAt: this.toReadableDate(updatedAt),
    };
  }

  private toReadableDate(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    const min = d.getMinutes().toString().padStart(2, '0');

    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${hour}:${min} ${ampm}`;
  }
}
