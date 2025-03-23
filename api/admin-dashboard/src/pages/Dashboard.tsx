import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Box,
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
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';

interface Statistics {
  totalUsers: number;
  activeUsers: number;
  averageWaterUsage: number;
  totalWaterSaved: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NODE_ENV === 'production'
          ? process.env.REACT_APP_PRODUCTION_API_URL
          : process.env.REACT_APP_API_URL;

        const response = await axios.get(`${apiUrl}/api/admin/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();
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
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom>
            Su Tüketimi Yönetim Paneli
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 3, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Toplam Kullanıcı
              </Typography>
              <Typography variant="h4">
                {stats?.totalUsers || 0}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Aktif Kullanıcı
              </Typography>
              <Typography variant="h4">
                {stats?.activeUsers || 0}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ortalama Su Tüketimi
              </Typography>
              <Typography variant="h4">
                {stats?.averageWaterUsage || 0} L
              </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Toplam Tasarruf
              </Typography>
              <Typography variant="h4">
                {stats?.totalWaterSaved || 0} L
              </Typography>
            </Paper>
          </Box>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Hoş geldiniz!
            </Typography>
            <Typography variant="body1">
              Bu panel üzerinden kullanıcıları ve su tüketim verilerini yönetebilirsiniz.
              Yukarıdaki istatistikler sistemdeki genel durumu göstermektedir.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 