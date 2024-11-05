/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 */
export const authRoutes = ["/auth/login", "/auth/register"];

/**
 * An array of routes that are only accessible for admin users
 * These routes will redirect other users to the default login redirect
 */
export const adminRoutes = ["/applications", "/applications/london", "/applications/bristol", "/courses", "/students"];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API
 authentication purposes
 */
export const apiAuthPrefix = "/api/auth";

/**
 * An array of routes that are disabled
 * These routes will redirect to the default login redirect
 */
export const disabledRoutes = ["/auth/register"];

/**
 * The default redirect path after logging in
 */
export const DEFAULT_LOGIN_REDIRECT = "/";
