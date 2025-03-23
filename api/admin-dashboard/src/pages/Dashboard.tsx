import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';

interface LeaderboardData {
  users: Array<{
    id: string;
    username: string;
    totalWaterAmount: number;
    rank: number;
  }>;
  bestInitialScores: Array<{
    name: string;
    initialWaterprint: number;
    correctAnswers: number;
  }>;
  bestImprovements: Array<{
    name: string;
    improvement: string;
    initialWaterprint: number;
    currentWaterprint: number;
    tasksCompleted: number;
  }>;
  statistics: {
    totalUsers: number;
    averageImprovement: string;
    totalTasksCompleted: number;
    averageTasksPerUser: string;
  };
  dailyLeaders: any[];
  weeklyLeaders: any[];
  monthlyLeaders: any[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? process.env.REACT_APP_PRODUCTION_API_URL 
          : process.env.REACT_APP_API_URL;

        const response = await axios.get<LeaderboardData>(`${apiUrl}/api/admin/leaderboards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Kullanıcılar', icon: <PeopleIcon />, path: '/users' },
  ];

  if (!data) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            WaterApp Admin
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Çıkış
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
        }}
      >
        <Container>
          <Typography variant="h4" gutterBottom>
            Liderlik Tablosu
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Günlük Liderler
          </Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            {/* Daily leaderboard content */}
          </Paper>

          <Typography variant="h6" gutterBottom>
            Haftalık Liderler
          </Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            {/* Weekly leaderboard content */}
          </Paper>

          <Typography variant="h6" gutterBottom>
            Aylık Liderler
          </Typography>
          <Paper sx={{ p: 2 }}>
            {/* Monthly leaderboard content */}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 