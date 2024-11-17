import app from "../../app/app.js";
import { pool } from '../../db/database.js';
import { eventStore } from "../../lib/events/eventStore.js";
import { authenticateToken } from '../../middleware/auth.js';
import { validateBearerToken } from '../../lib/auth/validateToken.js';

class UpdateProfile {
    id!: string;
    bio?: string;
    avatarUrl?: string;
}

class ProfileUpdated {
    id!: string;
    bio?: string;
    avatarUrl?: string;
    updatedAt!: Date;
}

async function updateUserProfile(id: string, bio: string | undefined, avatarUrl: string | undefined): Promise<ProfileUpdated> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `UPDATE user_profiles 
             SET bio = $1, avatar_url = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING id, bio, avatar_url, updated_at`,
            [bio, avatarUrl, id]
        );
        await eventStore.append({
            type: 'ProfileUpdated',
            payload: result.rows[0],
            tags: [{ key: 'userId', value: id }]
        });
        await client.query('COMMIT');
        return result.rows[0];
    } finally {
        client.release();
    }
}

class UserProfile {
    id!: string;
    bio!: string;
    avatarUrl!: string;
}

async function getUserById(id: string): Promise<UserProfile | null> {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM user_profiles WHERE id = $1', [id]);
    return result.rows[0] || null;
}

type GetUser = (id: string) => Promise<UserProfile | null>;
type DoUpdateProfile = (id: string, bio: string | undefined, avatarUrl: string | undefined) => Promise<ProfileUpdated>;

async function handle(
    command: UpdateProfile,
    updateProfile: DoUpdateProfile,
    getUserById: GetUser,
): Promise<ProfileUpdated> {
    const user = await getUserById(command.id)

    if (!user) {
        throw new Error('User not found');
    }

    const result = await updateProfile(
        command.id,
        command.bio,
        command.avatarUrl
    );

    return result;
}

app.put('/profile', async (c) => {
    try {
        const payload = validateBearerToken(c.req.header('Authorization'));
        const command = await c.req.json() as UpdateProfile;
        return c.json(await handle(command, updateUserProfile, getUserById));
    } catch (error) {
        if (error.message === 'Token has expired') {
            return c.json({ error: 'Token expired' }, 401);
        }
        return c.json({ error: 'Unauthorized' }, 401);
    }
}); 