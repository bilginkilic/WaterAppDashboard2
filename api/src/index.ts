import './load-env';
import { getJwtSecret } from './config/jwt';
import { createApp } from './app';

// Fail at boot rather than on the first login when the secret is missing.
getJwtSecret();

const PORT = process.env.PORT || 3001;

createApp().listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
