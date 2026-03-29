import type { FastifyReply, FastifyRequest } from "fastify";
import { JWTExpired, JWSSignatureVerificationFailed } from "jose/errors";
import { verifySupabaseAccessToken } from "../auth/verifyAccessToken";

/**
 * Requires `Authorization: Bearer <supabase_access_token>`.
 * Sets `request.userId` from the token `sub` claim (matches `auth.users.id`).
 */
export async function requireAuth(
  req: FastifyRequest,
  res: FastifyReply
): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).send({ error: "Missing Authorization Bearer token" });
  }

  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).send({ error: "Empty access token" });
  }

  try {
    const { sub } = await verifySupabaseAccessToken(token);
    req.userId = sub;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("SUPABASE_JWT_SECRET")) {
      return res.status(500).send({ error: "Server auth is not configured" });
    }
    if (err instanceof JWTExpired) {
      return res.status(401).send({
        error:
          "Access token expired. Refresh the page or sign out and sign in again.",
      });
    }
    if (err instanceof JWSSignatureVerificationFailed) {
      return res.status(401).send({
        error:
          "JWT secret mismatch: set backend SUPABASE_JWT_SECRET to the value in Supabase Dashboard → Project Settings → API → JWT Secret (not the anon or service_role key). Restart the API after changing .env.",
      });
    }
    return res.status(401).send({
      error: `Invalid session (${msg.slice(0, 200)})`,
    });
  }
}
