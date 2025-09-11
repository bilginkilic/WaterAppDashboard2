import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import GridAnimation from '../components/GridAnimation';

const floatAnimation = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const glowAnimation = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(138, 43, 226, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.4);
  }
  100% {
    box-shadow: 0 0 5px rgba(138, 43, 226, 0.2);
  }
`;

const AnimatedContainer = styled(Container)({
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
});

const GlassBox = styled(Box)({
  width: '100%',
  maxWidth: '400px',
  animation: `${floatAnimation} 6s ease-in-out infinite`,
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  animation: `${glowAnimation} 4s ease-in-out infinite`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(148, 0, 211, 0.2) 100%)',
    opacity: 0.5,
    zIndex: -1,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(5px)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(138, 43, 226, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'rgba(138, 43, 226, 0.8)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiOutlinedInput-input': {
    color: 'white',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, rgba(138, 43, 226, 0.8) 30%, rgba(148, 0, 211, 0.8) 90%)',
  border: 0,
  borderRadius: theme.spacing(1),
  boxShadow: '0 3px 5px 2px rgba(138, 43, 226, 0.3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(45deg, rgba(138, 43, 226, 1) 30%, rgba(148, 0, 211, 1) 90%)',
    transform: 'scale(1.02)',
    boxShadow: '0 5px 15px 2px rgba(138, 43, 226, 0.4)',
  },
}));

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <>
      <GridAnimation />
      <AnimatedContainer>
        <GlassBox>
          <StyledPaper elevation={3}>
              <Typography
              component="h1"
              variant="h4"
              sx={{
                mb: 4,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                textShadow: '0 2px 8px rgba(138, 43, 226, 0.3)',
                letterSpacing: '1px',
              }}
            >
              WaterApp Admin
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', minWidth: '300px' }}>
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    backgroundColor: 'rgba(253, 237, 237, 0.8)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {error}
                </Alert>
              )}
              <StyledTextField
                margin="normal"
                required
                fullWidth
                label="Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <StyledTextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <StyledButton
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
              >
                Sign In
              </StyledButton>
            </Box>
          </StyledPaper>
        </GlassBox>
      </AnimatedContainer>
    </>
  );
};

export default Login;