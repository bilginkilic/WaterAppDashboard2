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
  Fade,
  LinearProgress,
  Skeleton,
  CircularProgress,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
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
}

// Animasyonlu loading efekti için styled components
const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
`;

const LoadingBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  gap: theme.spacing(3),
  animation: `${pulse} 1.5s ease-in-out infinite`,
}));

const LoadingCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  maxWidth: 400,
  width: '100%',
}));

const Dashboard: React.FC = () => {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl = 'https://waterappdashboard2.onrender.com';

        const response = await axios.get<LeaderboardData>(`${apiUrl}/api/admin/leaderboards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Veri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <LoadingBox>
        <LoadingCard>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Veriler Yükleniyor
          </Typography>
          <LinearProgress sx={{ mt: 2, mb: 1 }} />
          <Typography variant="body2" color="textSecondary">
            Lütfen bekleyin...
          </Typography>
        </LoadingCard>
      </LoadingBox>
    );
  }

  if (error) {
    return (
      <LoadingBox>
        <LoadingCard>
          <Typography variant="h6" color="error" gutterBottom>
            Hata
          </Typography>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 3 }}
          >
            Yeniden Dene
          </Button>
        </LoadingCard>
      </LoadingBox>
    );
  }

  if (!data) {
    return (
      <LoadingBox>
        <LoadingCard>
          <Typography variant="h6" color="error">
            Veri bulunamadı
          </Typography>
        </LoadingCard>
      </LoadingBox>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            WaterApp Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Statistics Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">{data.statistics.totalUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Improvement
                </Typography>
                <Typography variant="h4">{data.statistics.averageImprovement}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Tasks Completed
                </Typography>
                <Typography variant="h4">{data.statistics.totalTasksCompleted}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Tasks per User
                </Typography>
                <Typography variant="h4">{data.statistics.averageTasksPerUser}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Best Initial Scores */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Best Initial Scores
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Initial Waterprint</TableCell>
                      <TableCell align="right">Correct Answers</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.bestInitialScores.map((score, index) => (
                      <TableRow key={index}>
                        <TableCell>{score.name}</TableCell>
                        <TableCell align="right">{score.initialWaterprint}</TableCell>
                        <TableCell align="right">{score.correctAnswers}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Best Improvements */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Best Improvements
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Improvement</TableCell>
                      <TableCell align="right">Tasks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.bestImprovements.map((improvement, index) => (
                      <TableRow key={index}>
                        <TableCell>{improvement.name}</TableCell>
                        <TableCell align="right">{improvement.improvement}%</TableCell>
                        <TableCell align="right">{improvement.tasksCompleted}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Improvement Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Improvements Chart
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.bestImprovements}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="improvement" name="Improvement %" fill="#2196f3" />
                  <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard; 