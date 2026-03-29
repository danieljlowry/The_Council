import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    /** Set by `requireAuth` after Supabase access token verification (`sub` claim). */
    userId?: string;
  }
}
