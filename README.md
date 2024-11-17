# Splice test Service

A simple user registration and authentication service built with Hono, TypeScript, and Event Sourcing.

## Features

- User registration
- User authentication with JWT
- OpenAPI/Swagger documentation
- Postgres database as the primary state persistence store.
- Event storage with in-memory store, for sub processing. e.g. sending a notification email after a user is created etc.
- Database Migration
- Docker containerization

## Prerequisites

- Node.js 20+
- npm
- Docker (optional)

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd user-service
```

Install dependencies:
```bash
npm install
```
## Database Setup

### Migrations

The project uses PostgreSQL. Before running the application, you need to set up the database and run migrations:

```bash

# Run migrations
npm run migrate
```

The migrations will:
1. Create the users table
3. Set up necessary indexes and constraints

### Database Configuration

The application expects the following environment variables for database connection:

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=user_service
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start at http://localhost:3000

## API Documentation

Once the server is running, you can access:

```
open http://localhost:3000
```
