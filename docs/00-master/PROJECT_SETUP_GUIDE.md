# SmartShopPOS Project Setup Guide

## Document Information

| Property     | Value                 |
| ------------ | --------------------- |
| Document     | Project Setup Guide   |
| Product      | SmartShopPOS          |
| Version      | 1.0.0                 |
| Status       | Development Blueprint |
| Owner        | Engineering Team      |
| Last Updated | July 2026             |

---

# 1. Purpose

This document defines the initial development environment and project structure for SmartShopPOS.

The objective is to create a professional foundation supporting:

- Backend development
- Frontend development
- Desktop packaging
- SaaS deployment
- Automated testing
- Continuous integration

---

# 2. Technology Stack

## Backend

Node.js

Fastify

TypeScript

MongoDB

Redis

Swagger/OpenAPI

Zod

Vitest

Pino Logger

---

## Frontend

Recommended:

React

TypeScript

Vite

Tailwind CSS

React Query

Zustand

Alternative:

Vue 3 can be supported because architecture is frontend independent.

---

## Desktop

Future:

Electron

or

Tauri

---

## Infrastructure

Docker

Docker Compose

Nginx

GitHub Actions

---

# 3. Repository Strategy

SmartShopPOS uses:

Monorepo Architecture

Reason:

Shared code.

Single versioning.

Simpler deployment.

---

# 4. Root Folder Structure

smartshoppos/

│
├── apps/
│
│ ├── api/
│ │
│ ├── web/
│ │
│ └── desktop/
│
│
├── packages/
│
│ ├── config/
│ │
│ ├── types/
│ │
│ ├── validation/
│ │
│ └── utils/
│
│
├── infrastructure/
│
│ ├── docker/
│ │
│ ├── nginx/
│ │
│ └── scripts/
│
│
├── docs/
│
│
├── tests/
│
│
├── .github/
│
│
├── package.json
├── docker-compose.yml
├── README.md
└── .env.example

---

# 5. Package Manager Decision

Recommended:

pnpm

Reasons:

- Faster installs
- Excellent monorepo support
- Workspace management
- Less disk usage

---

# 6. Backend Structure

Location:

apps/api

Structure:

api/

src/

├── app/

├── config/

├── database/

├── plugins/

├── shared/

├── modules/

│
├── server.ts

---

# 7. Frontend Structure

Location:

apps/web

Structure:

web/

src/

├── app/

├── components/

├── features/

├── layouts/

├── hooks/

├── services/

├── stores/

├── routes/

└── main.tsx

---

# 8. Shared Packages

## Types Package

Purpose:

Shared TypeScript contracts.

Example:

packages/types

User

Product

Sale

Payment

---

## Validation Package

Shared schemas.

Example:

ProductSchema

SaleSchema

UserSchema

---

## Utils Package

Reusable helpers.

Example:

currency formatter

date helpers

barcode helpers

---

# 9. Environment Management

Structure:

.env

.env.example

.env.development

.env.production

---

Example:

NODE_ENV=

PORT=

DATABASE_URL=

REDIS_URL=

JWT_SECRET=

MPESA_KEY=

PAYSTACK_KEY=

ETIMS_KEY=

---

# 10. Docker Development Environment

Services:

docker-compose.yml

API

MongoDB

Redis

Mongo Express

---

Development startup:

docker compose up

---

# 11. Fastify Initial Setup

Required plugins:

@fastify/swagger

@fastify/swagger-ui

@fastify/jwt

@fastify/cors

@fastify/rate-limit

---

# 12. Swagger Requirements

Swagger available from day one.

Endpoint:

/docs

---

Every API endpoint must contain:

- Summary
- Description
- Request schema
- Response schema
- Authentication requirements

---

# 13. Logging Setup

Use:

Pino

Example:

Request received

User authenticated

Sale created

Payment processed

---

# 14. Error Handling

Centralized error handler.

Example:

AppError

ValidationError

AuthenticationError

PermissionError

---

# 15. Testing Setup

Backend:

Vitest

Fastify inject

Supertest

---

Test levels:

Unit Tests

Integration Tests

End-to-End Tests

---

# 16. Code Quality Tools

Required:

ESLint

Prettier

Husky

Lint-staged

Commitlint

---

# 17. Git Workflow

Branches:

main

develop

feature/\*

bugfix/\*

hotfix/\*

---

# 18. Commit Standards

Use:

Conventional Commits

Examples:

feat(products): add barcode scanning

fix(payment): resolve mpesa callback

docs(api): update swagger

---

# 19. Pre-Commit Hooks

Before commit:

Run:

lint

format check

tests

type check

---

# 20. CI Pipeline

Every push:

Install dependencies

↓

Lint

↓

Type check

↓

Tests

↓

Build

---

# 21. Initial Development Milestones

Phase 1:

Project foundation

Phase 2:

Authentication

Phase 3:

Organization management

Phase 4:

Products

Phase 5:

Inventory

Phase 6:

Sales

Phase 7:

Payments

Phase 8:

Integrations

Phase 9:

AI features

---

# 22. Final Decision

SmartShopPOS will be built as a pnpm monorepo containing Fastify backend, frontend application, shared packages, infrastructure tooling, and future desktop application support.
