# Smart Pocket Money Tracker - Project Guide

## Project Overview

A Next.js 16 application for managing pocket money budgets with:
- CRUD operations for pocket budgets
- AI-powered natural language processing via OpenRouter
- Neon Serverless PostgreSQL database
- TypeScript with strict typing
- Class-based architecture (OOP)

## Architecture

### Layer Pattern
```
API Routes → Controllers → Services → Database
               ↓
         Response Handlers
```

### Directory Structure
```
app/
  api/
    pocket/
      route.ts           # GET /api/pocket, POST /api/pocket
      [id]/route.ts      # GET/PUT/DELETE /api/pocket/:id
      prompt/route.ts    # POST /api/pocket/prompt (AI)
    health/route.ts      # GET /api/health
src/
  lib/
    database.ts          # PostgreSQL connection pool (pg)
    openrouter.ts        # OpenRouter AI client
    api-response.ts      # Standardized response utilities
  services/
    PocketService.ts     # Business logic, DB operations
  controllers/
    PocketController.ts  # Request handling, validation
  types/
    pocket.ts            # TypeScript interfaces
docs/
  openapi.yaml           # OpenAPI 3.0 specification
```

## Database

**Provider**: Neon Serverless PostgreSQL
**Connection**: Via connection pool in `src/lib/database.ts`

### Schema: `pockets` table
```sql
CREATE TABLE pockets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### REST CRUD
- `GET /api/pocket` - List all pockets (query: `?active=true`)
- `POST /api/pocket` - Create pocket
- `GET /api/pocket/:id` - Get by ID
- `PUT /api/pocket/:id` - Update
- `DELETE /api/pocket/:id` - Delete

### AI Endpoint
- `POST /api/pocket/prompt` - Natural language processing
  - Body: `{ "prompt": "string" }`
  - Model: `qwen/qwen-3.5-flash`
  - Actions: create, update, delete, list

### Health
- `GET /api/health` - Health check with DB status

## Coding Standards

### General
- **TypeScript**: Strict mode, explicit types
- **OOP**: Class-based services and controllers
- **DRY**: Reusable utilities in `src/lib/`
- **Security**: Input validation, parameterized queries

### Response Format
All API responses use standardized format from `src/lib/api-response.ts`:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "total": 5  // for lists
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { "field": ["validation error"] }
}
```

### Error Handling
- Use `withErrorHandler()` wrapper for consistent error handling
- Validate all inputs in controllers
- Never expose internal errors to clients

## Environment Variables

Required in `.env.local`:
```env
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-...
```

## Development Commands

```bash
npm run dev   # Development server (Turbopack)
npm run build # Production build
npm start     # Production server
npm run lint  # ESLint
```

## Testing

### Manual Testing with curl

**Create pocket:**
```bash
curl -X POST http://localhost:3000/api/pocket \
  -H "Content-Type: application/json" \
  -d '{"name":"Groceries","balance":500}'
```

**AI prompt:**
```bash
curl -X POST http://localhost:3000/api/pocket/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Add Savings pocket with $1000"}'
```

**Health check:**
```bash
curl http://localhost:3000/api/health
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/database.ts` | DB connection pool setup |
| `src/lib/api-response.ts` | Response utilities |
| `src/services/PocketService.ts` | DB operations |
| `src/controllers/PocketController.ts` | Validation + business logic |
| `src/lib/openrouter.ts` | AI API client |

## Common Tasks

### Adding a new endpoint
1. Add route in `app/api/`
2. Import controller/service
3. Use `withErrorHandler()` wrapper
4. Use `successResponse()` / `errorResponse()`

### Adding a new model
1. Add TypeScript interface in `src/types/`
2. Create Service class in `src/services/`
3. Create Controller class in `src/controllers/`
4. Create database migration
5. Add API routes

### Database changes
Use `mcp__Neon__run_sql` or `mcp__Neon__prepare_database_migration` tools.

## External Resources

- [Neon Docs](https://neon.com/docs)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [OpenRouter API](https://openrouter.ai/docs)
- [OpenAPI Spec](./docs/openapi.yaml)
