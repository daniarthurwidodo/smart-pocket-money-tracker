# Product Requirements Document (PRD)

## Smart Pocket Money Tracker

**Version:** 1.0.0  
**Last Updated:** 2026-04-11  
**Status:** Completed  
**Author:** Development Team

---

## 1. Executive Summary

### 1.1 Product Overview

Smart Pocket Money Tracker is a modern web application that enables users to manage personal budget allocations through "pockets" - virtual envelopes for different spending categories. The application combines traditional CRUD functionality with AI-powered natural language processing, allowing users to manage their budgets through conversational commands.

### 1.2 Problem Statement

Traditional budgeting apps often require multiple clicks and form submissions to perform simple operations. Users want a faster, more intuitive way to:
- Track money allocated to different spending categories
- Quickly add or modify budget entries
- Get insights without navigating complex menus

### 1.3 Solution

A streamlined API-first application with:
- Simple REST endpoints for pocket management
- AI-powered natural language interface for hands-free operations
- Real-time health monitoring for reliability
- Multi-currency support for international users

### 1.4 Target Users

| User Type | Description | Primary Use Case |
|-----------|-------------|------------------|
| Individual Users | Personal finance management | Track monthly budget allocations |
| Families | Shared expense management | Manage household spending categories |
| Students | Allowance tracking | Monitor limited funds across categories |
| Developers | API integration | Build custom financial dashboards |

---

## 2. Product Goals

### 2.1 Primary Goals

| Goal | Success Metric | Target |
|------|----------------|--------|
| Fast pocket creation | Time to create pocket | < 2 seconds via AI |
| High API reliability | Uptime percentage | > 99.5% |
| Low latency | Average response time | < 500ms |
| User adoption | Daily active users | Measure post-launch |

### 2.2 Non-Goals

The following are explicitly **out of scope** for this version:

- User authentication and authorization
- Frontend UI (API-only release)
- Transaction history within pockets
- Automatic categorization of expenses
- Bank account integrations
- Mobile application

---

## 3. Functional Requirements

### 3.1 Pocket Management

#### FR-1: Create Pocket
| Field | Value |
|-------|-------|
| ID | FR-1 |
| Priority | P0 (Critical) |
| Description | Users shall be able to create new pockets with name, balance, and optional metadata |

**Acceptance Criteria:**
- [ ] API accepts POST request with pocket data
- [ ] Name field is required (max 100 characters)
- [ ] Balance defaults to 0 if not provided
- [ ] Currency defaults to USD if not provided
- [ ] Date defaults to current date if not provided
- [ ] Returns 201 on success with created pocket data
- [ ] Returns 400 on validation failure

**API Endpoint:** `POST /api/pocket`

---

#### FR-2: Read Pockets
| Field | Value |
|-------|-------|
| ID | FR-2 |
| Priority | P0 (Critical) |
| Description | Users shall be able to retrieve pocket data individually or as a list |

**Acceptance Criteria:**
- [ ] GET /api/pocket returns all pockets
- [ ] Query parameter `?active=true` filters to active only
- [ ] GET /api/pocket/:id returns single pocket
- [ ] Returns 404 if pocket ID does not exist
- [ ] Response includes total count for list operations

**API Endpoints:** 
- `GET /api/pocket`
- `GET /api/pocket/:id`

---

#### FR-3: Update Pocket
| Field | Value |
|-------|-------|
| ID | FR-3 |
| Priority | P0 (Critical) |
| Description | Users shall be able to modify existing pocket properties |

**Acceptance Criteria:**
- [ ] PUT /api/pocket/:id accepts partial updates
- [ ] All fields are optional (partial update supported)
- [ ] updated_at timestamp is automatically updated
- [ ] Returns 404 if pocket does not exist
- [ ] Returns 400 on validation failure

**API Endpoint:** `PUT /api/pocket/:id`

---

#### FR-4: Delete Pocket
| Field | Value |
|-------|-------|
| ID | FR-4 |
| Priority | P0 (Critical) |
| Description | Users shall be able to remove pockets permanently |

**Acceptance Criteria:**
- [ ] DELETE /api/pocket/:id removes the pocket
- [ ] Returns success message on deletion
- [ ] Returns 404 if pocket does not exist
- [ ] Operation is irreversible (no soft delete)

**API Endpoint:** `DELETE /api/pocket/:id`

---

### 3.2 AI-Powered Features

#### FR-5: Natural Language Pocket Creation
| Field | Value |
|-------|-------|
| ID | FR-5 |
| Priority | P1 (High) |
| Description | Users shall be able to create pockets using natural language commands |

**Acceptance Criteria:**
- [ ] POST /api/pocket/prompt accepts text prompts
- [ ] AI parses intent (create/update/delete/list)
- [ ] Extracts pocket properties from text
- [ ] Executes the parsed action automatically
- [ ] Returns action taken in response
- [ ] Handles unsupported requests gracefully

**Supported Commands:**
```
"Create a pocket called Groceries with $500"
"Add Entertainment budget of 200 USD"
"Update pocket 1 to have $750 balance"
"Delete pocket 3"
"Show me all my pockets"
"List active pockets only"
```

**API Endpoint:** `POST /api/pocket/prompt`

---

#### FR-6: AI Model Configuration
| Field | Value |
|-------|-------|
| ID | FR-6 |
| Priority | P1 (High) |
| Description | System shall use configurable AI model for prompt processing |

**Acceptance Criteria:**
- [ ] Uses Qwen 3.5 Flash model via OpenRouter
- [ ] Model can be changed via configuration
- [ ] API key loaded from environment variable
- [ ] Graceful failure when AI service unavailable

---

### 3.3 System Features

#### FR-7: Health Monitoring
| Field | Value |
|-------|-------|
| ID | FR-7 |
| Priority | P1 (High) |
| Description | System shall provide health status endpoint for monitoring |

**Acceptance Criteria:**
- [ ] GET /api/health returns status within 100ms
- [ ] Response includes database connectivity status
- [ ] Response includes database response time
- [ ] Response includes server uptime
- [ ] Returns 503 when unhealthy

**API Endpoint:** `GET /api/health`

---

## 4. Data Requirements

### 4.1 Data Model

#### Pocket Entity

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | SERIAL | Auto | - | Primary Key |
| name | VARCHAR(100) | Yes | - | Max 100 chars |
| balance | DECIMAL(12,2) | Yes | 0.00 | >= 0 |
| currency | VARCHAR(3) | Yes | IDR | ISO 4217 format |
| description | TEXT | No | NULL | - |
| is_active | BOOLEAN | Yes | true | - |
| created_at | TIMESTAMP | Auto | NOW() | Timezone aware |
| updated_at | TIMESTAMP | Auto | NOW() | Timezone aware |

### 4.2 Data Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Required, 1-100 chars | "Name is required" / "Name must not exceed 100 characters" |
| balance | Non-negative number | "Balance must be a non-negative number" |
| currency | 3-letter uppercase | "Currency must be a 3-letter ISO code" |

### 4.3 Data Retention

| Data Type | Retention Period | Deletion Policy |
|-----------|------------------|-----------------|
| Pocket records | Indefinite | User-initiated delete |
| System logs | 30 days | Automatic rotation |

---

## 5. Technical Requirements

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│              (curl, Postman, Frontend, Mobile)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
│                   API Route Handlers                        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Controllers    │ │   Controllers    │ │   Controllers    │
│   (Validation)   │ │   (Validation)   │ │   (Validation)   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
              │               │               │
              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
│                  (Business Logic)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│                   (Connection Pool)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Neon Serverless PostgreSQL                     │
│                    (Cloud Database)                          │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 16.x |
| Language | TypeScript | 5.x |
| Runtime | Node.js | 18+ |
| Database | Neon PostgreSQL | 17 |
| ORM/Driver | pg (node-postgres) | Latest |
| AI Provider | OpenRouter | API |
| AI Model | Qwen/Qwen3.5-Flash-02-23 | - |
| Styling | Tailwind CSS | 4.x |

### 5.3 API Response Format

**Standard Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed",
  "total": 5
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": {
    "fieldName": ["Specific validation error"]
  }
}
```

### 5.4 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 400 | Bad Request (Validation errors) |
| 404 | Not Found |
| 422 | Validation Error (detailed) |
| 500 | Internal Server Error |
| 502 | Bad Gateway (AI service down) |
| 503 | Service Unavailable (Health check failed) |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Requirement | Measurement |
|--------|-------------|-------------|
| API Response Time (p95) | < 500ms | Application logs |
| Database Query Time | < 200ms | pg_stat_statements |
| Health Check Time | < 100ms | Direct measurement |
| AI Prompt Processing | < 5000ms | End-to-end timing |

### 6.2 Reliability

| Metric | Target | Notes |
|--------|--------|-------|
| API Uptime | 99.5% | Excluding planned maintenance |
| Database Availability | 99.9% | Neon SLA dependent |
| Error Rate | < 1% | 5xx errors / total requests |

### 6.3 Security

| Requirement | Implementation |
|-------------|----------------|
| SQL Injection Prevention | Parameterized queries only |
| Input Validation | All inputs validated in controllers |
| API Keys | Stored in environment variables |
| SSL/TLS | Required for database connections |
| CORS | To be configured for production |

### 6.4 Scalability

| Aspect | Current | Future Consideration |
|--------|---------|---------------------|
| Database | Neon Serverless (auto-scale) | Connection pooling configured |
| Compute | Single instance (dev) | Horizontal scaling ready |
| Rate Limiting | Not implemented | Future requirement |

---

## 7. User Stories

### Epic 1: Pocket Management

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-1.1 | As a user, I want to create a new pocket so that I can allocate money for a specific purpose | P0 | Done |
| US-1.2 | As a user, I want to view all my pockets so that I can see my budget allocation | P0 | Done |
| US-1.3 | As a user, I want to view a specific pocket so that I can check its details | P0 | Done |
| US-1.4 | As a user, I want to update a pocket so that I can adjust my budget | P0 | Done |
| US-1.5 | As a user, I want to delete a pocket so that I can remove categories I no longer need | P0 | Done |
| US-1.6 | As a user, I want to filter pockets by active status so that I can focus on current budgets | P1 | Done |

### Epic 2: AI Features

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-2.1 | As a user, I want to create pockets using natural language so that I don't have to fill forms | P1 | Done |
| US-2.2 | As a user, I want to update pockets via conversation so that it feels natural | P1 | Done |
| US-2.3 | As a user, I want to list my pockets by asking so that I can get quick summaries | P1 | Done |

### Epic 3: System Operations

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-3.1 | As an operator, I want to check API health so that I can monitor system status | P1 | Done |
| US-3.2 | As a developer, I want clear error messages so that I can debug issues quickly | P1 | Done |
| US-3.3 | As a developer, I want API documentation so that I can integrate easily | P1 | Done |

---

## 8. API Documentation

### 8.1 Endpoint Summary

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/pocket` | GET | No | - | List all pockets |
| `/api/pocket` | POST | No | - | Create pocket |
| `/api/pocket/:id` | GET | No | - | Get pocket by ID |
| `/api/pocket/:id` | PUT | No | - | Update pocket |
| `/api/pocket/:id` | DELETE | No | - | Delete pocket |
| `/api/pocket/prompt` | POST | No | - | AI natural language |
| `/api/health` | GET | No | - | Health check |

### 8.2 Request/Response Examples

#### Create Pocket
```bash
# Request
POST /api/pocket
Content-Type: application/json

{
  "name": "Groceries",
  "balance": 500,
  "currency": "USD",
  "description": "Monthly grocery budget"
}

# Response (201 Created)
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Groceries",
    "balance": 500,
    "currency": "USD",
    "description": "Monthly grocery budget",
    "date": "2026-04-11",
    "isActive": true,
    "createdAt": "2026-04-11T04:04:36.794Z",
    "updatedAt": "2026-04-11T04:04:36.794Z"
  },
  "message": "Pocket created successfully"
}
```

#### AI Prompt
```bash
# Request
POST /api/pocket/prompt
Content-Type: application/json

{
  "prompt": "Add a Savings pocket with $1000 for vacation on April 15th"
}

# Response (200 OK)
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Savings",
    "balance": 1000,
    "currency": "USD",
    "description": "Vacation",
    "date": "2026-04-15",
    "isActive": true
  },
  "message": "Pocket created successfully via AI",
  "action": "create"
}
```

#### Health Check
```bash
# Request
GET /api/health

# Response (200 OK)
{
  "status": "healthy",
  "timestamp": "2026-04-11T04:19:02.173Z",
  "uptime": 678.03,
  "services": {
    "database": {
      "status": "connected",
      "responseTimeMs": 50
    }
  }
}
```

---

## 9. Dependencies

### 9.1 External Services

| Service | Purpose | Critical | Fallback |
|---------|---------|----------|----------|
| Neon PostgreSQL | Data persistence | Yes | None (data layer) |
| OpenRouter API | AI processing | No | Direct API endpoints |

### 9.2 npm Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.x | Framework |
| react | 19.x | UI library |
| pg | Latest | PostgreSQL driver |
| @types/pg | Latest | TypeScript types |
| typescript | 5.x | Type system |
| tailwindcss | 4.x | Styling |

---

## 10. Testing Strategy

### 10.1 Test Coverage Targets

| Test Type | Target Coverage | Status |
|-----------|-----------------|--------|
| Unit Tests | 80% services | Pending |
| Integration Tests | All endpoints | Pending |
| E2E Tests | Critical paths | Pending |

### 10.2 Manual Testing Checklist

- [ ] Create pocket via REST API
- [ ] Read all pockets
- [ ] Read single pocket by ID
- [ ] Update pocket
- [ ] Delete pocket
- [ ] Create pocket via AI prompt
- [ ] List pockets via AI prompt
- [ ] Health check returns connected status
- [ ] Invalid requests return proper error codes

---

## 11. Deployment

### 11.1 Environment Configuration

| Environment | Database | API Keys | Access |
|-------------|----------|----------|--------|
| Development | Neon dev branch | Developer keys | Localhost |
| Production | Neon main branch | Production keys | Public/Authenticated |

### 11.2 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENROUTER_API_KEY` | Yes (for AI) | OpenRouter API key |
| `NODE_ENV` | No | Environment (development/production) |

### 11.3 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Health check endpoint accessible
- [ ] SSL/TLS enabled for production
- [ ] Error logging configured
- [ ] Backup strategy in place

---

## 12. Future Considerations

### 12.1 Planned Features (v2.0)

| Feature | Description | Priority |
|---------|-------------|----------|
| User Authentication | JWT-based auth with sessions | P0 |
| Transaction Tracking | Record individual transactions within pockets | P0 |
| Budget Alerts | Notifications when pockets near depletion | P1 |
| Recurring Pockets | Auto-create pockets on schedule | P1 |
| Export Data | CSV/JSON export functionality | P2 |
| Dashboard UI | Web frontend for the API | P0 |

### 12.2 Technical Debt

| Item | Impact | Effort |
|------|--------|--------|
| Add rate limiting | Medium | Low |
| Implement caching | Low | Medium |
| Add request logging | Medium | Low |
| Database connection pooling tuning | Low | Low |

---

## 13. Glossary

| Term | Definition |
|------|------------|
| Pocket | A virtual envelope for budget allocation |
| Neon | Serverless PostgreSQL provider |
| OpenRouter | AI model aggregation API |
| Qwen | AI model by Alibaba (used for NLP) |
| CRUD | Create, Read, Update, Delete operations |

---

## 14. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | - | - | - |
| Tech Lead | - | - | - |
| Engineering | - | - | - |

---

## 15. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-11 | Development Team | Initial release |
