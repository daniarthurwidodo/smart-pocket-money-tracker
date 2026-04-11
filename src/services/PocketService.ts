import { getPool } from '../lib/database';
import { Pocket, CreatePocketInput, UpdatePocketInput } from '../types/pocket';

export class PocketService {
  private readonly tableName = 'pockets';

  async create(input: CreatePocketInput): Promise<Pocket> {
    const pool = getPool();
    const query = `
      INSERT INTO ${this.tableName} (name, balance, currency, description, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      input.name,
      input.balance ?? 0,
      input.currency ?? 'IDR',
      input.description ?? null,
      input.isActive ?? true,
    ];

    const result = await pool.query(query, values);
    return this.mapRowToPocket(result.rows[0]);
  }

  async getById(id: number): Promise<Pocket | null> {
    const pool = getPool();
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPocket(result.rows[0]);
  }

  async getAll(activeOnly?: boolean): Promise<Pocket[]> {
    const pool = getPool();
    let query = `SELECT * FROM ${this.tableName}`;
    const values: unknown[] = [];

    if (activeOnly) {
      query += ' WHERE is_active = $1';
      values.push(true);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows.map(row => this.mapRowToPocket(row));
  }

  async update(id: number, input: UpdatePocketInput): Promise<Pocket | null> {
    const pool = getPool();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }

    if (input.balance !== undefined) {
      updates.push(`balance = $${paramIndex++}`);
      values.push(input.balance);
    }

    if (input.currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`);
      values.push(input.currency);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }

    if (input.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(input.isActive);
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

    return this.mapRowToPocket(result.rows[0]);
  }

  async delete(id: number): Promise<boolean> {
    const pool = getPool();
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await pool.query(query, [id]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  private mapRowToPocket(row: Record<string, unknown>): Pocket {
    return {
      id: row.id as number,
      name: row.name as string,
      balance: Number(row.balance as number | string),
      currency: row.currency as string,
      description: row.description as string | null,
      isActive: row.is_active as boolean,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }
}
