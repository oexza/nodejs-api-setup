import { z } from '@hono/zod-openapi';
import { pool } from '../../db/database.js';
import bcrypt from 'bcrypt';
import { eventStore } from '../../lib/events/eventStore.js';
import { v7 as uuidv7 } from 'uuid';

// Zod schemas
export const registerUserSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8)
});

export const userRegisteredSchema = z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    hashedPassword: z.string()
});

class UserRegistered {
    id!: string;
    username!: string;
    email!: string;
    hashedPassword!: string;
}

// Types inferred from schemas
type RegisterUser = z.infer<typeof registerUserSchema>;
type User = z.infer<typeof userRegisteredSchema>;

type GetExistingUser = (username: string, email: string) => Promise<{ username: string, email: string } | null>;
type SaveUser = (user: UserRegistered) => Promise<UserRegistered>;

export async function getExistingUserByEmailOrUsername(username: string, email: string): Promise<{ username: string, email: string } | null> {
    const client = await pool.connect();

    try {
        const result = await client.query(
            'SELECT username, email FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
        client.release();
    }
}

export async function saveUser(userRegistered: User): Promise<UserRegistered> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            'INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
            [userRegistered.id, userRegistered.username, userRegistered.email, userRegistered.hashedPassword]
        );

        await eventStore.append<UserRegistered>({
            type: 'UserRegistered',
            payload: {
                id: userRegistered.id,
                username: userRegistered.username,
                email: userRegistered.email,
                hashedPassword: userRegistered.hashedPassword
            },
            tags: [
                { key: 'username', value: userRegistered.username },
                { key: 'email', value: userRegistered.email },
                { key: 'domain', value: 'registration' },
                { key: 'userId', value: userRegistered.id },
                { key: 'eventType', value: 'UserRegistered' }
            ]
        });

        await client.query('COMMIT');
        return userRegistered;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

interface RegisterUserInput {
    getExistingUserByEmailOrUsername: GetExistingUser,
    saveUser: SaveUser
}

export async function handle(command: RegisterUser, { getExistingUserByEmailOrUsername, saveUser }: RegisterUserInput): Promise<UserRegistered> {
    const existingUser = await getExistingUserByEmailOrUsername(command.username, command.email);

    if (existingUser) {
        throw new Error(
            command.username === existingUser.username
                ? 'Username already exists'
                : 'Email already exists'
        );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(command.password, saltRounds);

    return await saveUser({
        id: uuidv7(),
        username: command.username,
        email: command.email,
        hashedPassword: passwordHash
    });
}