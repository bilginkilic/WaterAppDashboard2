# WaterApp API

This is the backend API for the WaterApp application, providing authentication and water footprint tracking functionality.

## Features

- User Authentication (Register, Login, Password Reset)
- Water Footprint Profile Management
- Progress Tracking
- Firebase Integration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase Project
- Firebase Admin SDK Service Account

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your environment variables
   - Place your Firebase service account JSON file in the root directory as `firebase-service-account.json` or set it as an environment variable

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm start
   ```

For development:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Water Footprint

- `POST /api/waterprint/initial` - Create initial water footprint profile
- `PUT /api/waterprint/update` - Update water footprint
- `GET /api/waterprint/progress/:userId` - Get user progress

For detailed API documentation and request/response formats, refer to the scenario document.

## Security

- JWT authentication
- Input validation
- Firebase Authentication
- Environment variable configuration
- CORS enabled

## Error Handling

The API implements comprehensive error handling:
- Validation errors
- Authentication errors
- Not found errors
- Server errors

## Development

The project uses TypeScript and follows modern development practices:
- Express.js for the API framework
- Firebase Admin SDK for backend services
- Express Validator for input validation
- JWT for token-based authentication 