import { MITAppInventorController } from '../controllers/MITAppInventorController';
import { Transaction } from '../types/transaction';
import { ApiResponse } from '../types/pocket';

const controller = new MITAppInventorController();

/** Parse DD-M-YYYY or DD-MM-YYYY to YYYY-MM-DD */
export function parseTanggal(dateStr: string): string | null {
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (day.length > 2 || month.length > 2 || year.length !== 4) return null;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  if (isNaN(d) || isNaN(m) || d < 1 || d > 31 || m < 1 || m > 12) return null;
  return `${year}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
}

export async function handleMITCreate(
  body: Record<string, unknown>
): Promise<ApiResponse<Transaction>> {
  const tanggal = body.tanggal as string | undefined;
  const pemasukanRaw = body.pemasukan as string | number | undefined;
  const pengeluaranRaw = body.pengeluaran as string | number | undefined;

  if (!tanggal) {
    return { success: false, error: 'tanggal is required' };
  }

  const parsedDate = parseTanggal(typeof tanggal === 'string' ? tanggal : String(tanggal));
  if (!parsedDate) {
    return { success: false, error: 'Invalid tanggal format. Expected DD-MM-YYYY' };
  }

  const pemasukan = Number(pemasukanRaw) || 0;
  const pengeluaran = Number(pengeluaranRaw) || 0;
  const net = pemasukan - pengeluaran;

  if (net === 0) {
    return { success: false, error: 'pemasukan and pengeluaran must result in a non-zero net amount' };
  }

  const type = net > 0 ? 'income' : 'expense';
  const amount = Math.abs(net);

  const result = await controller.createTransaction({
    pocketId: 1,
    amount,
    type,
    date: parsedDate,
  });

  if (!result.success) {
    return { success: false, error: `Failed to create transaction: ${result.error}` };
  }

  return { success: true, data: result.data };
}
