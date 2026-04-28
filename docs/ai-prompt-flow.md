# Cara Kerja AI: Dari Kalimat Biasa Sampai Masuk Database

## Pengenalan

Fitur AI di aplikasi ini bikin kamu bisa catat uang jajan **cuma dengan ngetik kalimat biasa**. Nggak perlu isi form yang ribet. Cukup ketik kayak lagi chat:

> *"simpan 123 hari ini"*

dan AI otomatis ngejalanin semuanya buat kamu.

## Alur Kerja (Flow)

```
Kamu ngetik: "simpan 123 hari ini"
        ↓
1. API nerima pesan kamu
        ↓
2. OpenRouter (AI) baca & paham maksud kamu
        ↓
3. AI balikin hasil dalam format JSON
        ↓
4. Server ubah JSON jadi transaksi
        ↓
5. Data masuk ke database
```

## Step-by-Step Detail

### Step 1: Kamu Ngetik Kalimat

Kamu kirim kalimat lewat API. Bisa pakai format apapun:

| Yang Kamu Ketik | Hasilnya |
|-----------------|----------|
| `"simpan 123 hari ini"` | Pemasukan 123, tanggal hari ini |
| `"beli gorengan 5000"` | Pengeluaran 5000, tanggal hari ini |
| `"pemasukan 50000 tanggal 1 mei 2026"` | Pemasukan 50000, 1 Mei 2026 |
| `"tabungan 200 ribu"` | Pemasukan 200000, tanggal hari ini |

**Di dalam kode:**
- File: `app/api/mit-app-inventor/route.ts`
- Server ngecek: kalau body-nya **bukan JSON object**, anggap ini prompt AI

### Step 2: Prompt Dikirim ke AI (OpenRouter)

Server kirim prompt kamu ke **OpenRouter API** — semacam "jembatan" ke AI.

**Di dalam kode:**
- File: `src/lib/openrouter.ts`
- Model AI: **Google Gemini 2.5 Flash** (pintar bahasa Indonesia & JSON)

Prompt dikirim bareng **system prompt** yang nunjukin aturan:

```
System Prompt:
"Anda adalah asisten pelacak uang saku.
 Tanggal hari ini: 2026-04-28 (28-4-2026 dalam format DD-MM-YYYY)

 ACTION create_transaction:
 - pemasukan = uang masuk (default 0)
 - pengeluaran = uang keluar (default 0)
 - tanggal WAJIB, format DD-MM-YYYY
 - "200 ribu" = 200000
 - "hari ini" = gunakan tanggal hari ini
 - Kalau cuma sebut satu angka → itu pemasukan"

User Prompt:
"simpan 123 hari ini"
```

### Step 3: AI Balikin JSON

AI baca dan nyoba paham maksud kamu. AI langsung balikin JSON tanpa ngetik panjang lebar:

```json
{
  "action": "create_transaction",
  "transaction": {
    "pemasukan": 123,
    "pengeluaran": 0,
    "tanggal": "28-4-2026"
  }
}
```

AI yang "ngekalkulasi":
- `"simpan"` → bukan pengeluaran → jadi **pemasukan** 123
- `"hari ini"` → pakai tanggal hari ini (28-4-2026)
- `123` → langsung jadi angka 123

### Step 4: Server Proses Hasil AI

Server nerima JSON dari AI, lalu menghitung:

```
net = pemasukan - pengeluaran
net = 123 - 0 = 123

net > 0 → type = "income"
amount = 123
```

Terus server nyusun data buat masuk database:

```json
{
  "pocketId": 1,
  "amount": 123,
  "type": "income",
  "date": "28-4-2026"
}
```

**Di dalam kode:**
- File: `src/lib/mit-transaction.ts` — fungsi `handleMITCreate()`
- Tanggal `"28-4-2026"` diubah jadi `"2026-04-28"` (format database)

### Step 5: Data Disimpan ke Database

Data masuk ke tabel `transactions` di **Neon PostgreSQL**:

| Column | Value |
|--------|-------|
| `pocket_id` | 1 |
| `amount` | 123 |
| `type` | income |
| `date` | 2026-04-28 |
| `created_at` | (otomatis: waktu sekarang) |
| `updated_at` | (otomatis: waktu sekarang) |

Selesai! Data kamu udah tersimpan dan bisa diliat lewat API.

## Diagram: Semua yang Terjadi

```
┌─────────────────────────────────────────────┐
│  Kamu: "simpan 123 hari ini"               │
└──────────────────┬──────────────────────────┘
                   ↓
┌──────────────────────────────────────────┐
│  API: /api/mit-app-inventor?action=create │
│  → ngecek: ini string? → jalanin AI       │
└──────────────────┬───────────────────────┘
                   ↓
┌──────────────────────────────────────────┐
│  OpenRouter (Google Gemini 2.5 Flash)    │
│  → baca system prompt + user prompt      │
│  → balikin: {action, transaction}        │
└──────────────────┬───────────────────────┘
                   ↓
┌──────────────────────────────────────────┐
│  handleMITCreate()                       │
│  → 123 - 0 = 123 → type: income          │
│  → 28-4-2026 → 2026-04-28                │
└──────────────────┬───────────────────────┘
                   ↓
┌──────────────────────────────────────────┐
│  TransactionService.create()             │
│  → INSERT INTO transactions ...          │
└──────────────────┬───────────────────────┘
                   ↓
┌──────────────────────────────────────────┐
│  Neon PostgreSQL                         │
│  → data tersimpan ✅                     │
└──────────────────────────────────────────┘
```

## FAQ

**Q: AI bisa salah paham gak?**
A: Bisa. Makanya cek hasilnya di riwayat transaksi. Kalau salah, kamu bisa edit atau hapus.

**Q: Bisa pakai bahasa Inggris?**
A: Bisa! AI paham bahasa Indonesia dan English.

**Q: Angka "200 ribu" bisa dibaca?**
A: Ya. AI dikonversi angka teks ke angka biasa. "200 ribu" jadi 200000.

**Q: Apa aja kata kunci yang paham?**
A:
| Kata Kunci | Maknanya |
|------------|----------|
| `simpan`, `tabung`, `tabungan` | Pemasukan |
| `beli`, `pengeluaran`, `biaya` | Pengeluaran |
| `pemasukan`, `pendapatan` | Uang masuk |
| `hari ini`, `today`, `kini` | Tanggal hari ini |
| `kemarin`, `yesterday` | Tanggal kemarin |
