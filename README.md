# Smart Pocket Money Tracker

A Next.js application for managing pocket money budgets with AI-powered natural language processing.

## Features

- **CRUD Operations**: Create, read, update, and delete pocket budgets
- **AI-Powered Prompts**: Use natural language to manage pockets (Bahasa Indonesia & English)
- **Nameless Pockets**: Create savings pockets without a name - just specify amount and date
- **Target Date Tracking**: Set target dates for savings goals (e.g., "2026-02-20")
- **Multi-Currency Support**: Track budgets in any 3-letter ISO currency
- **Active/Inactive Filtering**: Filter pockets by status
- **Health Monitoring**: Built-in health check endpoint for monitoring

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Neon Serverless PostgreSQL
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **AI Integration**: OpenRouter API (NVIDIA/Nemotron-3-Super-120B-A12B:free)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenRouter API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smart-pocket-money-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env.local` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
OPENROUTER_API_KEY=your-openrouter-api-key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## API Endpoints

### Pockets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pocket` | List all pockets |
| GET | `/api/pocket?active=true` | List only active pockets |
| POST | `/api/pocket` | Create a new pocket |
| GET | `/api/pocket/:id` | Get a pocket by ID |
| PUT | `/api/pocket/:id` | Update a pocket |
| DELETE | `/api/pocket/:id` | Delete a pocket |

### AI-Powered

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pocket/prompt` | Process natural language commands |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check API and database health |

## Request/Response Examples

### Create Pocket (with name)
```bash
curl -X POST http://localhost:3000/api/pocket \
  -H "Content-Type: application/json" \
  -d '{"name":"Groceries","balance":500000,"currency":"IDR","description":"Monthly budget"}'
```

### Create Pocket (without name, with target date)
```bash
curl -X POST http://localhost:3000/api/pocket \
  -H "Content-Type: application/json" \
  -d '{"balance":5000,"targetDate":"2026-02-20","description":"Tabungan liburan"}'
```

### AI Prompt (English)
```bash
curl -X POST http://localhost:3000/api/pocket/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Add a pocket called Entertainment with $200 for movies"}'
```

### AI Prompt (Bahasa Indonesia - with target date)
```bash
curl -X POST http://localhost:3000/api/pocket/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Saya ingin menyimpan 5000 tanggal 20 februari 2026"}'
```

**Example AI responses:**
| Prompt | Action |
|--------|--------|
| "Buat pocket Hiburan dengan 200 ribu" | Creates pocket with name "Hiburan", balance 200000 |
| "Saya ingin menyimpan 5000 tanggal 20 februari 2026" | Creates pocket with balance 5000, targetDate "2026-02-20" (no name) |
| "Update pocket 5 jadi 500 ribu" | Updates pocket ID 5 with balance 500000 |
| "Hapus pocket 3" | Deletes pocket ID 3 |
| "Tampilkan semua pocket" | Lists all pockets |

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Database Schema

The `pockets` table has the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | VARCHAR(100) NULL | Pocket name (optional, can be null) |
| `balance` | DECIMAL(12,2) | Current balance |
| `currency` | VARCHAR(3) | ISO currency code (IDR, USD, etc.) |
| `description` | TEXT | Optional description |
| `target_date` | DATE | Target/save date (e.g., "2026-02-20") |
| `is_active` | BOOLEAN | Active status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Notes:**
- `name` is optional - pockets can be created without a name for savings-focused tracking
- `target_date` stores the target date mentioned by users (e.g., "untuk tanggal 20 februari 2026")

## Project Structure

```
smart-pocket-money-tracker/
├── app/
│   ├── api/
│   │   ├── pocket/
│   │   │   ├── route.ts          # GET, POST /api/pocket
│   │   │   ├── [id]/
│   │   │   │   └── route.ts      # GET, PUT, DELETE /api/pocket/:id
│   │   │   └── prompt/
│   │   │       └── route.ts      # POST /api/pocket/prompt
│   │   └── health/
│   │       └── route.ts          # GET /api/health
│   └── page.tsx
├── src/
│   ├── lib/
│   │   ├── database.ts           # Database connection pool
│   │   ├── openrouter.ts         # OpenRouter AI client
│   │   └── api-response.ts       # Response handler utilities
│   ├── services/
│   │   └── PocketService.ts      # Business logic
│   ├── controllers/
│   │   └── PocketController.ts   # Request handlers
│   └── types/
│       └── pocket.ts             # TypeScript interfaces
├── docs/
│   └── openapi.yaml              # OpenAPI 3.0 documentation
└── .env.local                    # Environment variables
```

## API Documentation

Full OpenAPI 3.0 documentation is available in `docs/openapi.yaml`.

You can view it using tools like:
- [Swagger Editor](https://editor.swagger.io/)
- [Stoplight Studio](https://stoplight.io/)
- [Redoc](https://redocly.com/)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | Yes (for prompt endpoint) |

## AI Prompt Examples

The AI endpoint supports natural language commands in Bahasa Indonesia and English.

### Creating Pockets

| Prompt | Result |
|--------|--------|
| "Buat pocket Tabungan dengan 50000" | Creates pocket with name "Tabungan", balance 50000 |
| "Saya ingin menyimpan 10000 tanggal 20 februari 2026" | Creates pocket with balance 10000, targetDate "2026-02-20" |
| "Add a pocket called Vacation with $500" | Creates pocket with name "Vacation", balance 500 |

### Updating Pockets

| Prompt | Result |
|--------|--------|
| "Update pocket 5 jadi 500 ribu" | Updates pocket ID 5 with balance 500000 |
| "Change pocket 3 name to Entertainment" | Updates pocket ID 3 name to "Entertainment" |

### Deleting Pockets

| Prompt | Result |
|--------|--------|
| "Hapus pocket 3" | Deletes pocket ID 3 |
| "Delete pocket 7" | Deletes pocket ID 7 |

### Listing Pockets

| Prompt | Result |
|--------|--------|
| "Tampilkan semua pocket" | Lists all pockets |
| "Show only active pockets" | Lists active pockets only |

## Debugging and Logging

### Error Logging Format

The `/api/pocket/prompt` endpoint includes detailed error logging with request tracking:

**Log format:** `[PromptAPI:{requestId}] {message}`

Each error log includes:
- **Request ID**: Unique identifier for correlation (format: `{timestamp}-{random}`)
- **Timestamp**: Automatically included in request ID
- **Elapsed time**: For performance monitoring
- **Contextual data**: Prompt text, parsed results, validation errors

**Example error scenarios logged:**
- Invalid JSON body
- Missing/empty prompt
- OpenRouter API errors (with stack traces)
- Validation failures
- Action-specific errors (create/update/delete/list)

### Retry Mechanism

The OpenRouter AI client includes automatic retry with fallback model:

| Setting | Value | Description |
|---------|-------|-------------|
| Timeout | 15s | Maximum time for each request attempt |
| Max retries (primary) | 2 | Up to 2 retry attempts with primary model |
| Retry delay | 2s | Wait time between retries |
| Primary model | `nvidia/nemotron-3-super-120b-a12b:free` | NVIDIA Nemotron model |
| Fallback model | `google/gemini-2.5-flash-lite` | Google Gemini (used if primary fails) |

**Retry flow:**
1. Request sent to primary model (NVIDIA Nemotron)
2. If request fails or times out, retry up to 2 times
3. If all primary model retries exhausted, switch to fallback (Google Gemini)
4. If fallback fails, return error - no more retries

**Log messages:**
- `OpenRouter request with {model} took {elapsed}ms or failed, retrying ({retryCount}/{maxRetries})...`
- `OpenRouter primary model ({primary}) failed after {n} attempts, switching to fallback model ({fallback})...`
- `OpenRouter fallback model ({fallback}) also failed after {elapsed}ms. No more retries.`

**Viewing logs:**
```bash
# Development (next.js dev server output)
npm run dev

# Production (check your hosting platform logs)
# Vercel: vercel logs
# Docker: docker logs <container-id>
```

## License

MIT
