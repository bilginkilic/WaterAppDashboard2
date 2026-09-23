# WaterAppDashboard2 - Admin Dashboard & Backend Service

This repository contains the backend service and admin dashboard for [WaterApp V2](https://apps.apple.com/tr/app/waterapp-v2/id6745251786), a mobile application designed to help users track and reduce their water footprint. The backend provides essential services for user management, water footprint tracking, and administrative oversight.

## 🌊 About WaterApp

WaterApp is a mobile application that helps users understand and reduce their water consumption through:
- Interactive water footprint surveys
- Personalized challenges
- Progress tracking
- Achievement systems
- Educational content

This backend service supports all these features while providing administrative tools for monitoring and managing user data.

## 🚀 Features

### API Services
- User authentication and management
- Water footprint calculation and tracking
- Progress monitoring and statistics
- Challenge management
- Administrative endpoints for user oversight

### Admin Dashboard
- User management interface
- Water consumption analytics
- Progress tracking visualization
- Top performer identification
  - Most improved users
  - Lowest water footprint users
- System monitoring tools

## 🛠 Technical Stack

### Backend
- Node.js with TypeScript
- Express.js framework
- Firebase Authentication
- Firebase Admin SDK
- JWT token authentication
- RESTful API architecture

### Admin Dashboard
- React with TypeScript
- Next.js framework
- Tailwind CSS
- Context API for state management
- Real-time data updates

### Security
- JWT-based authentication
- Role-based access control
- Firebase security rules
- Middleware protection for admin routes

## 📝 API Documentation

The API provides several endpoints for:

1. Authentication
   - User registration
   - Login
   - Password reset

2. Water Footprint Management
   - Initial profile creation
   - Footprint updates
   - Progress tracking

3. Administrative Functions
   - User listing
   - Statistics generation
   - Performance monitoring

For detailed API documentation, please refer to the API rules section.

## 🔧 Environment Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables:
```env
# Copy .env.example to .env and update with your credentials
cp .env.example .env
```
4. Start the development server:
```bash
npm run dev
```

## 🔐 Admin Access

Admin URL: your Netlify production URL from the site dashboard, path `/login`.

Please contact the system administrator for access credentials.

Admin login is checked on the server. The dashboard needs these Netlify environment variables (mark the password and secret as **secret**, with a value for the Production context). Redeploy after changing them, because Netlify reads them at deploy time:

| Variable | Purpose |
|---|---|
| `ADMIN_EMAIL` | Admin login e-mail |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_SESSION_SECRET` | Signs the session cookie; at least 32 random characters (`openssl rand -base64 48`) |

If any of them is missing, `/api/admin/login` returns `503`. Every `/api/admin/*` data route returns `401` without a valid session.

### Organisation labels

Users can be labelled **MUFG Turkey** or **MUFG London**. The label is stored in Firestore at `users/{uid}.organization`.

- **Dashboard:** filter the user list by organisation, or change a user's label from the user detail dialog.
- **API:** `POST /api/admin/users/organization` with `{ "userIds": [...], "organization": "MUFG Turkey" | "MUFG London" | null }` (admin session required).
- **Bulk (by e-mail list):** `cd api && npx ts-node src/scripts/set-organization.ts --emails list.txt --org "MUFG Turkey" --rest "MUFG London"`. It is a dry run by default; add `--apply` to write.

## 📱 Related Applications

- [WaterApp V2 iOS App](https://apps.apple.com/tr/app/waterapp-v2/id6745251786)
- [WaterApp Website](https://waterapp2.lovable.app/)

## 📄 License

© 2024 Bilgin Kılıç. All rights reserved.
