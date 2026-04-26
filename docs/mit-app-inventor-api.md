# MIT App Inventor API Endpoint

## Overview

Single-endpoint CRUD API designed for MIT App Inventor's Web component. Uses a `?action=` query parameter pattern instead of standard REST HTTP methods.

**Base URL:** `GET/POST/PUT/DELETE /api/mit-app-inventor`

## Database Schema

### `transactions` table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `pocket_id` | INTEGER | NOT NULL, FK → pockets(id) ON DELETE CASCADE | Parent pocket |
| `amount` | DECIMAL(12,2) | NOT NULL, CHECK >= 0 | Transaction amount |
| `type` | VARCHAR(10) | NOT NULL, CHECK IN ('income','expense') | Transaction type |
| `category` | VARCHAR(50) | NULLABLE | Category label |
| `description` | TEXT | NULLABLE | Notes |
| `date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Transaction date |
| `created_at` | TIMESTAMP TZ | DEFAULT NOW() | Created timestamp |
| `updated_at` | TIMESTAMP TZ | DEFAULT NOW() | Updated timestamp |

**Indexes:** `pocket_id`, `type`, `date DESC`

## Actions

### List Transactions

```
GET /api/mit-app-inventor?action=list
GET /api/mit-app-inventor?action=list&pocket_id=3
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | No (default: `list`) | Must be `list` |
| `pocket_id` | number | No | Filter by pocket |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pocketId": 3,
      "amount": 50000,
      "type": "income",
      "category": "Allowance",
      "description": "Weekly allowance",
      "date": "2026-04-20",
      "createdAt": "2026-04-20T10:00:00.000Z",
      "updatedAt": "2026-04-20T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Get Single Transaction

```
GET /api/mit-app-inventor?action=get&id=5
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | Must be `get` |
| `id` | number | Yes | Transaction ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "pocketId": 3,
    "amount": 25000,
    "type": "expense",
    "category": "Transport",
    "description": "Bus fare",
    "date": "2026-04-22",
    "createdAt": "2026-04-22T08:00:00.000Z",
    "updatedAt": "2026-04-22T08:00:00.000Z"
  }
}
```

### Create Transaction

```
POST /api/mit-app-inventor?action=create
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | Must be `create` |

**Request Body:**
```json
{
  "pocketId": 3,
  "amount": 50000,
  "type": "income",
  "category": "Allowance",
  "description": "Weekly allowance",
  "date": "2026-04-20"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pocketId` | number | Yes | Must reference existing pocket |
| `amount` | number | Yes | Must be > 0 |
| `type` | string | Yes | `"income"` or `"expense"` |
| `category` | string | No | Max 50 characters |
| `description` | string | No | |
| `date` | string | No | Format: `YYYY-MM-DD`, defaults to today |

**Response (201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Transaction created successfully"
}
```

### Update Transaction

```
PUT /api/mit-app-inventor?action=update&id=5
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | Must be `update` |
| `id` | number | Yes | Transaction ID |

**Request Body (partial update):**
```json
{
  "amount": 60000,
  "description": "Updated description"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | No | Must be > 0 |
| `type` | string | No | `"income"` or `"expense"` |
| `category` | string | No | Max 50 characters |
| `description` | string | No | |
| `date` | string | No | Format: `YYYY-MM-DD` |

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Transaction updated successfully"
}
```

### Delete Transaction

```
DELETE /api/mit-app-inventor?action=delete&id=5
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | Must be `delete` |
| `id` | number | Yes | Transaction ID |

**Response:**
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

## Error Responses

All errors follow the same format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success (list, get, update, delete) |
| 201 | Created (create) |
| 400 | Bad request (invalid input, missing params) |
| 404 | Not found (transaction/pocket doesn't exist) |
| 500 | Server error |

## MIT App Inventor Usage

### Setup
Set the Web component URL to: `http://your-domain.com/api/mit-app-inventor`

### List All Transactions
- Use Web1.Get method with URL: `.../api/mit-app-inventor?action=list`
- Parse JSON response, access `data` list

### Create Transaction
- Use Web1.PostText method
- URL: `.../api/mit-app-inventor?action=create`
- Content: `{"pocketId":1,"amount":50000,"type":"expense","category":"Food"}`
- Set Content-Type header to `application/json`

### Update Transaction
- Use Web1.PutText method
- URL: `.../api/mit-app-inventor?action=update&id=5`
- Content: `{"amount":60000}`

### Delete Transaction
- Use Web1.Delete method
- URL: `.../api/mit-app-inventor?action=delete&id=5`

## curl Examples

```bash
# Create a pocket first (required for transactions)
curl -X POST http://localhost:3000/api/pocket \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Pocket","balance":100000}'

# Create transaction
curl -X POST 'http://localhost:3000/api/mit-app-inventor?action=create' \
  -H "Content-Type: application/json" \
  -d '{"pocketId":1,"amount":50000,"type":"expense","category":"Food","description":"Lunch"}'

# List all transactions
curl 'http://localhost:3000/api/mit-app-inventor?action=list'

# List transactions for specific pocket
curl 'http://localhost:3000/api/mit-app-inventor?action=list&pocket_id=1'

# Get single transaction
curl 'http://localhost:3000/api/mit-app-inventor?action=get&id=1'

# Update transaction
curl -X PUT 'http://localhost:3000/api/mit-app-inventor?action=update&id=1' \
  -H "Content-Type: application/json" \
  -d '{"amount":60000,"description":"Updated lunch"}'

# Delete transaction
curl -X DELETE 'http://localhost:3000/api/mit-app-inventor?action=delete&id=1'
```
