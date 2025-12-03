# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Open Foris Arena is a cloud-based platform for storing and processing data collected in field inventories or questionnaires. It provides multilingual data entry forms, multi-cycle data management, data quality assurance with validation, and integrated statistical analysis with RStudio Server.

**Key technologies:**

- Node.js 24.11.1
- React 18 (frontend)
- Express (backend)
- PostgreSQL with PostGIS
- Redux Toolkit for state management
- Webpack for bundling

## Code Architecture

### Directory Structure

The codebase is organized into four main directories with path aliases configured:

- **`common/`** (`@common/*`) - Shared constants, enums, and type definitions used by both client and server
  - API routes definitions (`apiRoutes/`)
  - Job types and constants (`job/`)
  - Data import types (`dataImport/`)
  - WebSocket event definitions (`webSocket/`)

- **`core/`** (`@core/*`) - Shared business logic and domain models (isomorphic code)
  - **`survey/`** - Survey domain model (survey structure, node definitions, categories, taxonomies)
  - **`record/`** - Record domain model (data records, nodes, validation)
  - **`user/`** - User domain model
  - **`auth/`** - Authentication/authorization model
  - Utility modules (date, string, array, object utils)
  - Expression parser for survey expressions

- **`server/`** (`@server/*`) - Backend server code
  - **`modules/`** - Feature modules organized by domain (survey, record, user, category, taxonomy, etc.)
    - Each module typically has: `api/`, `service/`, `repository/` subdirectories
  - **`db/`** - Database layer with pg-promise
  - **`system/`** - Server initialization, clustering, schedulers
  - **`job/`** - Background job processing

- **`webapp/`** (`@webapp/*`) - React frontend application
  - **`views/`** - Main view components (App, Home, Designer, Data, Analysis, Users)
  - **`components/`** - Reusable UI components
  - **`store/`** - Redux store slices and actions
  - **`service/`** - API client services
  - **`utils/`** - Frontend utility functions

### Key Architectural Patterns

**Domain Model in `core/`:**
The `core/` directory contains pure domain logic that can run on both client and server. Domain objects (Survey, Record, NodeDef, etc.) are immutable and manipulated through functional utilities:

```javascript
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

// Example: Add a node definition to a survey
const surveyUpdated = Survey.assocNodeDef({ nodeDef })(survey)
```

**Module Organization:**
Server modules follow a layered architecture:

- `api/` - Express route handlers
- `service/` - Business logic orchestration
- `repository/` - Database queries and persistence
- `manager/` - Higher-level coordination across services

**State Management:**
Frontend uses Redux Toolkit with slices in `webapp/store/`. Each feature area has its own slice (survey, record, user, etc.).

**Database:**

- PostgreSQL accessed via pg-promise
- Migration system in `server/db/` (look for migration files)
- JSONB columns extensively used for flexible schema (props, meta, validation)

## Common Development Commands

### Development

```bash
# Install dependencies
yarn install

# Start development server (both client and server with hot reload)
yarn watch
# This starts webpack dev server on port 9000 (proxies to backend on 9090)
# and node-dev with inspect mode for the server

# Run only the server in dev mode
yarn dev:server

# Run only the client dev server
yarn client:dev-server
```

### Building

```bash
# Build for production (builds both client and server)
yarn build

# Build client only (development)
yarn build-dev

# Build client only (production)
yarn build-prod

# Build server only (production)
yarn build:server:prod

# Build server only (development)
yarn build:server:dev
```

### Testing

```bash
# Run all tests (unit + e2e)
yarn test

# Run unit tests only
yarn test:unit

# Run e2e tests only
yarn test:e2e

# Run integration tests
yarn test:integration

# Run e2e tests in watch/debug mode
yarn test:e2e:watch

# Generate e2e test code with Playwright codegen
yarn test:e2e:codegen
```

### Linting

```bash
# Lint and fix (runs via lint-staged on pre-commit)
# Targets: {common,core,server,test,webapp}/**/*.js
npx eslint --cache --fix path/to/file.js
```

### Database

```bash
# Run database migrations only (without starting server)
yarn server:migrate
```

### Docker

```bash
# Build and run with Docker
docker build -t openforis/arena .
docker run --env-file ./arena.env --network="host" openforis/arena:latest

# Run test suite in Docker
yarn test:docker
```

## Development Workflow

### Running a Single Test File

For e2e tests:

```bash
jest --config=test/e2e/jest.config.js test/e2e/tests/yourTest.js
```

For unit tests (after building):

```bash
yarn build:test:unit
jest dist/__tests__/bundle.unit.js
```

### Adding a New Survey Node Definition Type

When adding a new node definition type or modifying the survey schema:

1. Update domain model in `core/survey/nodeDef*.js`
2. Update database repository in `server/modules/nodeDef/repository/`
3. Update API endpoints in `server/modules/nodeDef/api/`
4. Update React components in `webapp/views/App/views/Designer/`
5. Update Redux slice in `webapp/store/survey/`

### Working with Database Migrations

Database migrations are in `server/db/` directory. The server automatically runs migrations on startup unless `MIGRATE_ONLY=true` is set.

## Important Notes

**Path Aliases:**
All imports use path aliases defined in `jsconfig.json` and webpack config:

- `@common/*` → `./common/*`
- `@core/*` → `./core/*`
- `@server/*` → `./server/*`
- `@webapp/*` → `./webapp/*`
- `@test/*` → `./test/*`

**Hot Reload:**
When using `yarn watch`, the webpack dev server runs on port 9000 and proxies API/auth requests to the backend server on port 9090. Both client and server support hot reload.

**Console Logging:**
The ESLint config has `"no-console": "error"`. Use the `log4js` logger from `@server/log/log` on the server side instead of console.log.

**JSDoc Required:**
The project enforces comprehensive JSDoc comments. All functions should have:

- Description ending with period
- `@param` with type and description for each parameter
- `@returns` with type and description

**Immutability:**
Core domain objects are treated as immutable. Use Ramda or the provided utility functions for updates rather than mutating objects directly.

**Survey vs Record:**

- **Survey** = the form definition/schema (node definitions, categories, taxonomies)
- **Record** = an instance of collected data following a survey schema

**Background Jobs:**
Long-running operations use the job system in `server/job/`. Jobs are persisted to database and can be monitored via WebSocket.

## Testing Notes

**E2E Tests:**

- Use Playwright with jest-playwright-preset
- Tests are in `test/e2e/tests/`
- Authentication state is saved in `test/e2e/resources/auth.json`
- Test utilities in `test/e2e/tests/utils/`

**Integration Tests:**

- Located in `test/integration/`
- Require database connection
- Bundled via webpack before running with Jest

**Unit Tests:**

- Located in `test/unit/`
- Bundled via webpack before running with Jest
