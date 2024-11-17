import { Context } from 'hono';
import jwt from 'jsonwebtoken';

export async function authenticateToken(c: Context, next: () => Promise<void>) {
    const authHeader = c.req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        c.status(401);
        return c.json({ error: 'Unauthorized' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        c.set('user', user);
        await next();
    } catch (err) {
        c.status(403);
        return c.json({ error: 'Invalid token' });
    }
} 