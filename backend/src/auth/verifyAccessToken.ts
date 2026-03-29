import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
} from "jose";
import type { JWTPayload } from "jose";

/**
 * Verifies a Supabase-issued access token.
 *
 * - **HS256** (legacy shared secret): set `SUPABASE_JWT_SECRET` (Dashboard → API → JWT Secret).
 * - **ES256 / RS256** (asymmetric / newer projects): set `SUPABASE_URL` to `https://<ref>.supabase.co`
 *   and verify via `.../auth/v1/.well-known/jwks.json` (JWT Secret alone is not used for these).
 *
 * @see https://supabase.com/docs/guides/auth/jwts
 */

const jwksByBaseUrl = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

function getRemoteJwkSet(supabaseUrl: string) {
  const base = supabaseUrl.replace(/\/$/, "");
  let jwks = jwksByBaseUrl.get(base);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${base}/auth/v1/.well-known/jwks.json`)
    );
    jwksByBaseUrl.set(base, jwks);
  }
  return jwks;
}

export async function verifySupabaseAccessToken(
  token: string
): Promise<{ sub: string }> {
  let header: ReturnType<typeof decodeProtectedHeader>;
  try {
    header = decodeProtectedHeader(token);
  } catch {
    throw new Error("Invalid token: malformed JWT header");
  }

  const alg = header.alg;
  let payload: JWTPayload;

  if (alg === "HS256") {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret?.trim()) {
      throw new Error("SUPABASE_JWT_SECRET is not set (required for HS256 tokens)");
    }
    const key = new TextEncoder().encode(secret);
    ({ payload } = await jwtVerify(token, key, { algorithms: ["HS256"] }));
  } else if (alg === "ES256" || alg === "RS256") {
    const base = process.env.SUPABASE_URL?.trim();
    if (!base) {
      throw new Error(
        "SUPABASE_URL is not set (required to verify ES256/RS256 tokens). Use the same value as NEXT_PUBLIC_SUPABASE_URL, e.g. https://xxxx.supabase.co"
      );
    }
    const issuer = `${base.replace(/\/$/, "")}/auth/v1`;
    const JWKS = getRemoteJwkSet(base);
    try {
      ({ payload } = await jwtVerify(token, JWKS, {
        algorithms: [alg],
        issuer,
      }));
    } catch {
      ({ payload } = await jwtVerify(token, JWKS, { algorithms: [alg] }));
    }
  } else {
    throw new Error(
      `Unsupported JWT algorithm: ${alg ?? "missing"}. Expected HS256, ES256, or RS256.`
    );
  }

  const sub = payload.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("Invalid token: missing sub");
  }

  return { sub };
}
