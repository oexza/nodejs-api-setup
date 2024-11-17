import { createRoute, z } from '@hono/zod-openapi';
import { pool } from '../db/database.js';
import jwt from 'jsonwebtoken';
import { eventStore } from "../lib/events/eventStore.js";
import bcrypt from 'bcrypt';
import type { Context } from 'node:vm';

// Zod schemas
const loginUserSchema = z.object({
    username: z.string(),
    password: z.string()
});

const userLoggedInSchema = z.object({
    username: z.string(),
    token: z.string()
});

const userSchema = z.object({
    username: z.string(),
    passwordHash: z.string()
});

// Types inferred from schemas
type LoginUser = z.infer<typeof loginUserSchema>;
type UserLoggedIn = {
    username: string;
    token: string;
};
type User = z.infer<typeof userSchema>;

type GetUser = (username: string) => Promise<User | null>;
type CreateToken = (username: string) => Promise<string>;
type SaveUserLoggedIn = (userAuthenticated: UserLoggedIn) => Promise<void>;

async function getUserByUsername(username: string): Promise<User | null> {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT username, password_hash FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return {
            username: result.rows[0].username,
            passwordHash: result.rows[0].password_hash
        };
    } finally {
        client.release();
    }
}

async function saveUserLoggedIn(userLoggedIn: UserLoggedIn): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            'INSERT INTO user_logins (username) VALUES ($1)',
            [userLoggedIn.username]
        );

        await eventStore.append({
            type: 'UserLoggedIn',
            payload: {
                username: userLoggedIn.username,
                token: userLoggedIn.token
            },
            tags: [
                { key: 'username', value: userLoggedIn.username },
                { key: 'domain', value: 'login' },
            ]
        });

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function generateAuthToken(username: string): Promise<string> {
    return jwt.sign(
        { username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
}

interface LoginUserInput {
    getUser: GetUser,
    createToken: CreateToken,
    saveUserLoggedIn: SaveUserLoggedIn
}

async function handle(
    command: LoginUser,
    { getUser, createToken, saveUserLoggedIn }: LoginUserInput
): Promise<UserLoggedIn> {
    const user = await getUser(command.username);

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(command.password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }

    const token = await createToken(user.username);

    await saveUserLoggedIn({
        username: user.username,
        token
    });

    return {
        username: user.username,
        token
    };
}

// Define response schemas
const successResponseSchema = z.object({
    username: z.string(),
    token: z.string()
});

const errorResponseSchema = z.object({
    error: z.string()
});

// Route definition with OpenAPI metadata
export const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    tags: ['Users'],
    description: 'Authenticate a user',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: loginUserSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: 'User logged in successfully',
            content: {
                'application/json': {
                    schema: successResponseSchema
                }
            }
        },
        400: {
            description: 'Invalid credentials',
            content: {
                'application/json': {
                    schema: errorResponseSchema
                }
            }
        }
    }
});

export const loginHandler = async (c: Context) => {
    try {
        const command = await c.req.json();
        const validated = loginUserSchema.parse(command);
        const result = await handle(validated, {
            getUser: getUserByUsername,
            createToken: generateAuthToken,
            saveUserLoggedIn
        });

        const response = successResponseSchema.parse(result);
        return c.json(response, 200);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const response = errorResponseSchema.parse({ error: 'Invalid input' });
            return c.json(response, 400);
        }
        const response = errorResponseSchema.parse({ error: error.message });
        return c.json(response, 400);
    }
}; 