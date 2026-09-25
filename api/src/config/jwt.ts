/**
 * Single source for the JWT signing secret. A missing secret used to fall back
 * to a public default, which let anyone forge user and admin tokens.
 */
const DEV_FALLBACK = 'dev-only-insecure-jwt-secret';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  // Render sets RENDER=true on its hosts; the Docker image does not set NODE_ENV.
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    throw new Error('JWT_SECRET must be set in production');
  }
  return DEV_FALLBACK;
}
