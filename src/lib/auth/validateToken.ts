import jwt from 'jsonwebtoken';

export interface TokenPayload {
    username: string;
    exp?: number;
}

export function validateBearerToken(authHeader: string | undefined): TokenPayload {
    if (!authHeader) {
        throw new Error('No authorization header');
    }

    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
        throw new Error('Invalid authorization header format');
    }

    try {
        const payload = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your-secret-key'
        ) as TokenPayload;

        if (!payload.username) {
            throw new Error('Invalid token payload');
        }

        return payload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token has expired');
        }
        throw new Error('Invalid token');
    }
} 