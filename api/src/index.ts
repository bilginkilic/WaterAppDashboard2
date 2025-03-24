import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import waterprintRoutes from './routes/waterprint.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3000', 'https://waterappdashboard2.onrender.com'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/waterprint', waterprintRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 