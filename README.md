# User Service

A simple user registration and authentication service built with Hono, TypeScript, and Event Sourcing.

## Features

- User registration
- User authentication with JWT
- OpenAPI/Swagger documentation
- Postgres database as the primary state persistence store.
- Event storage with in-memory store, for sub processing. e.g. sending a notification email after a user is created etc.
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
