import { createRoute, z } from '@hono/zod-openapi';
import type { Context } from "node:vm";
import { hashPassword, registerUserSchema } from './RegisterUser.js';
import { handle, getExistingUserByEmailOrUsername, saveUser } from './RegisterUser.js';


// Define response schemas explicitly
const successResponseSchema = z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
});

const errorResponseSchema = z.object({
    error: z.string()
});

// Route definition with OpenAPI metadata
export const registerRoute = createRoute({
    method: 'post',
    path: '/register',
    tags: ['Start Registration'],
    description: 'Register a new user',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: registerUserSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: 'User registered successfully',
            content: {
                'application/json': {
                    schema: successResponseSchema
                }
            }
        },
        400: {
            description: 'Invalid input or user already exists',
            content: {
                'application/json': {
                    schema: errorResponseSchema
                }
            }
        }
    }
});

// Route handler with proper typing
export const registerRouteHandler = async (c: Context) => {
    try {
        const command = await c.req.json();
        const validated = registerUserSchema.parse(command);
        const result = await handle(validated, { getExistingUserByEmailOrUsername, saveUser, passwordHasher: hashPassword });

        const response = successResponseSchema.parse({
            id: result.id,
            username: result.username,
            email: result.email
        });
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