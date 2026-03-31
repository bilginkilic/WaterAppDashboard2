/** Default hosted API (no trailing slash). Must match workspace API base. */
const DEFAULT_API_URL = 'https://waterappdashboard2.onrender.com';

/**
 * Base URL for the WaterApp API (no trailing slash).
 * - Production builds: always use hosted API so REACT_APP_API_URL=localhost is never baked in.
 * - Development: REACT_APP_API_URL for local API, otherwise same hosted API (no running server needed).
 */
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_PRODUCTION_API_URL || DEFAULT_API_URL
    : process.env.REACT_APP_API_URL || DEFAULT_API_URL;
