import { app } from './app.js';
import { registerRoute, registerRouteHandler } from '../user_registration/register_user/register_user_api.js';
import { loginRoute, loginHandler } from '../user_authentication/LoginUser.js';
// Register routes
app.openapi(registerRoute, registerRouteHandler);
app.openapi(loginRoute, loginHandler);
// Add more routes here as needed 