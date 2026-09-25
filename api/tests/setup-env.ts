// Every API test runs against the in-memory Firebase with a fixed JWT secret.
process.env.WATERAPP_FAKE_FIREBASE = '1';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ADMIN_EMAIL = 'admin@waterapp.test';
process.env.ADMIN_PASSWORD = 'admin-pass';
delete process.env.RENDER;
