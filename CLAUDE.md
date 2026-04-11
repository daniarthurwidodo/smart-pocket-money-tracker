# Smart Pocket Money Tracker - Project Guide

## Constitution

### Core Principles
- **Use reusable code** - OOP class-based architecture
- **Add security** - Validate inputs, use parameterized queries, never expose internal errors
- **Use defensive programming** - Expect failures, handle nulls, wrap async operations
- **Use DRY (Don't Repeat Yourself)** - Extract common logic to `src/lib/`

### Guardrails
- **No ambiguity** - Ask for clarity when requirements are unclear
- **No making tests** - Focus on implementation, not test files
- **No magic numbers** - Use named constants for all values
- **No magic strings** - Use constants for string literals (currency codes, actions, etc.)

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
    name VARCHAR(100) NULL,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT,
    target_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes:**
- `name` is nullable - pockets can be created without a name (savings-focused)
- `target_date` stores the target/save date mentioned by users (e.g., "2026-02-20")

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
  - Model: `nvidia/nemotron-3-super-120b-a12b:free` (primary), `google/gemini-2.5-flash-lite` (fallback)
  - Actions: create, update, delete, list
  
**Response includes:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Pocket created successfully via AI",
  "metadata": {
    "action": "create",
    "modelUsed": "nvidia/nemotron-3-super-120b-a12b:free",
    "fallbackUsed": false,
    "retryCount": 0
  }
}
```

### Health
- `GET /api/health` - Health check with DB status

## Coding Standards

### General
- **TypeScript**: Strict mode, explicit types
- **OOP**: Class-based services and controllers
- **DRY**: Reusable utilities in `src/lib/`
- **Security**: Input validation, parameterized queries

### Defensive Programming

**1. Input Validation**
- Validate ALL inputs at system boundaries (API routes, public methods)
- Never trust external data (request body, query params, path params)
- Use type guards for runtime type checking
- Validate array lengths, string lengths, and numeric ranges

**2. Null/Undefined Handling**
- Use explicit null checks before accessing properties
- Use optional chaining (`?.`) for nested property access
- Use nullish coalescing (`??`) for default values
- Return early for null/invalid inputs

**3. Error Handling**
- Wrap async operations in try-catch blocks
- Use `withErrorHandler()` for consistent API error handling
- Log errors with context (request ID, input data, timing)
- Never expose stack traces or internal errors to clients
- Use specific error types for different failure scenarios

**4. Database Safety**
- Always use parameterized queries (never concatenate SQL)
- Handle connection failures gracefully
- Validate data before database operations
- Check for null results from database queries

**5. Type Safety**
- Use TypeScript strict mode
- Define explicit return types
- Use interfaces for complex objects
- Never use `any` - use `unknown` with type guards if needed

**6. Security**
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Validate API request bodies before processing
- Log security-relevant events (validation failures, auth errors)

**Example Pattern:**
```typescript
async function create(input: CreatePocketInput): Promise<Pocket> {
  // 1. Validate input
  const errors = this.validateInput(input);
  if (errors.length > 0) {
    return { success: false, error: errors.join(', ') };
  }

  // 2. Safe database operation with try-catch
  try {
    const pool = getPool();
    const result = await pool.query(query, [input.name ?? null, input.balance ?? 0]);
    
    // 3. Check result
    if (result.rows.length === 0) {
      return { success: false, error: 'Failed to create' };
    }
    
    return this.mapRowToPocket(result.rows[0]);
  } catch (error) {
    console.error('Create failed:', error);
    throw error; // Let error handler wrap it
  }
}
```

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

**Response Helper Functions:**
| Function | Status | Use Case |
|----------|--------|----------|
| `successResponse(data)` | 200 | Standard success |
| `successResponse(data, { status: 201 })` | 201 | Resource created |
| `badRequestResponse('message')` | 400 | Invalid input |
| `validationError({ field: ['error'] })` | 422 | Validation failed |
| `notFoundResponse()` | 404 | Resource not found |
| `unauthorizedResponse()` | 401 | Authentication required |
| `serverErrorResponse()` | 500 | Internal error |
| `errorResponse('msg', { status: 502 })` | Custom | Custom error |

### Error Handling

**General Rules:**
- Use `withErrorHandler()` wrapper for consistent error handling
- Validate all inputs in controllers
- Never expose internal errors to clients
- Log errors with sufficient context for debugging

**Error Response Patterns:**
```typescript
// Validation errors (400/422)
return validationError({ field: ['error message'] });

// Not found (404)
return notFoundResponse('Resource not found');

// Unauthorized (401)
return unauthorizedResponse('Authentication required');

// Server errors (500)
return serverErrorResponse('Internal server error');
```

**Logging Best Practices:**
- Include request ID for correlation
- Log elapsed time for performance monitoring
- Include input data (sanitized) for debugging
- Use structured logging with consistent format

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
