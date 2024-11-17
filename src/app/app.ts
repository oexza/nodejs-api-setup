import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

// Create and export the OpenAPIHono instance
export const app = new OpenAPIHono();

// Add swagger UI and documentation
app.doc('/swagger', {
    openapi: '3.0.0',
    info: {
        title: 'Splice API',
        version: '1.0.0',
        description: 'API for Splice'
    }
});

app.get('/docs', swaggerUI({ url: '/swagger' }));

export default app;