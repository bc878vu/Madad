// Vercel serverless entry point for the existing MADAD Express API.
// The API server itself must never call app.listen() on Vercel; Vercel
// invokes this handler directly and provides the HTTP request/response.
import app from "../artifacts/api-server/src/app";

export default function handler(req: any, res: any) {
  return app(req, res);
}
