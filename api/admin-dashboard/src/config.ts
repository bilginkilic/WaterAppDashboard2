/** Base URL for the WaterApp API (no trailing slash). */
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_PRODUCTION_API_URL ||
  'https://waterappdashboard2.onrender.com';
