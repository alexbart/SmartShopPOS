# SmartShopPOS Project Initialization Guide

## Document Information

| Property     | Value                        |
| ------------ | ---------------------------- |
| Document     | Project Initialization Guide |
| Product      | SmartShopPOS                 |
| Version      | 1.0.0                        |
| Status       | Development Blueprint        |
| Owner        | Engineering Team             |
| Last Updated | July 2026                    |

---

# 1. Purpose

This document defines the first steps required to create the SmartShopPOS codebase.

The objective is to create:

- A scalable monorepo
- Backend foundation
- Frontend foundation
- Shared packages
- Development tooling
- CI/CD preparation

---

# 2. Repository Creation

Repository:

smartshoppos

Initialize:

```bash
git init
3. Package Manager

SmartShopPOS uses:

pnpm

Install:

npm install -g pnpm

Verify:

pnpm --version
4. Node.js Version

Use:

Node.js LTS

Version managed using:

.nvmrc

Example:

22
5. Initialize Root Project

Create:

pnpm init

Root package.json:

{
"name":"smartshoppos",
"private":true,
"version":"1.0.0"
}
6. Configure Workspace

Create:

pnpm-workspace.yaml

Content:

packages:
  - apps/*
  - packages/*
7. Root Folder Creation

Create:

smartshoppos/

├── apps/

├── packages/

├── infrastructure/

├── docs/

├── tests/

├── .github/

├── package.json

├── pnpm-workspace.yaml

├── .env.example

└── README.md
8. Application Structure

Create:

apps/

├── api

├── web

└── desktop
9. Backend Initialization

Location:

apps/api

Technology:

Fastify

TypeScript

Prisma

PostgreSQL

Initialize:

pnpm init

Install:

pnpm add fastify
pnpm add -D typescript tsx
10. Backend Dependencies

Production:

fastify

@fastify/cors

@fastify/jwt

@fastify/swagger

@fastify/swagger-ui

zod

pino

prisma

@prisma/client

Development:

typescript

tsx

vitest

eslint

prettier

husky
11. Backend Folder Structure
api/

src/

├── app/

├── config/

├── database/

├── plugins/

├── shared/

├── modules/

├── server.ts

12. Prisma Setup

Initialize:

pnpm prisma init

Creates:

prisma/

schema.prisma

.env
13. PostgreSQL Setup

Development database:

Docker container.

Example:

postgres:

database:
smartshoppos_dev

user:
smartshoppos

password:
smartshoppos
14. First Prisma Connection

Environment:

DATABASE_URL=

Example:

postgresql://user:password@localhost:5432/smartshoppos
15. Swagger Setup

Swagger must be available immediately.

Endpoint:

/docs

Verify:

http://localhost:4000/docs
16. Frontend Initialization

Location:

apps/web

Technology:

React

TypeScript

Vite

Create:

pnpm create vite web

Select:

React

TypeScript
17. Shared Packages

Create:

packages/

├── types

├── validation

├── utils

└── config
18. Code Quality Setup

Install:

ESLint

Prettier

Husky

lint-staged
19. Git Hooks

Before every commit:

Run:

lint

format

tests

type-check
20. Initial Git Commit

First commit:

chore: initialize SmartShopPOS monorepo
21. Development Scripts

Root scripts:

Example:

{
"dev":"pnpm --parallel dev",

"test":"pnpm --recursive test",

"lint":"pnpm --recursive lint"
}
22. Docker Development

Create:

docker-compose.yml

Services:

postgres

redis

api

web
23. Environment Files

Create:

.env.example

Contains:

DATABASE_URL=

REDIS_URL=

JWT_SECRET=

PORT=

Never commit:

.env
24. Initial Verification Checklist

Before development:

✓ Repository created

✓ Workspace works

✓ API starts

✓ Frontend starts

✓ PostgreSQL connects

✓ Prisma works

✓ Swagger loads

✓ Tests execute

✓ Git hooks run

Final Decision

SmartShopPOS starts as a pnpm monorepo using Fastify, React, PostgreSQL, Prisma, Docker, Swagger, and automated quality tooling.


---

# 🏗 Chief Architect Checkpoint

At this stage our first milestone is:

## Milestone 0 — Foundation Complete

Expected repository:


smartshoppos

├── apps
│
│ ├── api
│ │
│ ├── web
│ │
│ └── desktop
│
├── packages
│
├── infrastructure
│
├── docs
│
└── tests
```
