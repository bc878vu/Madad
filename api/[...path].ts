// Vercel serverless entry point for the existing MADAD Express API.
// Export the Express application itself. Vercel invokes it with the
// incoming request and response, so this module must not call app.listen().
import app from "../artifacts/api-server/src/app";

export default app;
