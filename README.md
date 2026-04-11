# Smart Pocket Money Tracker

A Next.js application for managing pocket money budgets with AI-powered natural language processing.

## Features

- **CRUD Operations**: Create, read, update, and delete pocket budgets
- **AI-Powered Prompts**: Use natural language to manage pockets (e.g., "Add a Savings pocket with $1000 for vacation")
- **Multi-Currency Support**: Track budgets in any 3-letter ISO currency
- **Active/Inactive Filtering**: Filter pockets by status
- **Health Monitoring**: Built-in health check endpoint for monitoring

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Neon Serverless PostgreSQL
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **AI Integration**: OpenRouter API (Qwen 3.5 Flash)

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

### Create Pocket
```bash
curl -X POST http://localhost:3000/api/pocket \
  -H "Content-Type: application/json" \
  -d '{"name":"Groceries","balance":500,"currency":"USD","description":"Monthly budget"}'
```

### AI Prompt
```bash
curl -X POST http://localhost:3000/api/pocket/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Add a pocket called Entertainment with $200 for movies"}'
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Database Schema

The `pockets` table has the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | VARCHAR(100) | Pocket name |
| `balance` | DECIMAL(12,2) | Current balance |
| `currency` | VARCHAR(3) | ISO currency code (USD, EUR, etc.) |
| `description` | TEXT | Optional description |
| `date` | DATE | Associated date |
| `is_active` | BOOLEAN | Active status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

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

## License

MIT
