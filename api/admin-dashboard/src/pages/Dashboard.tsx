import React from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Su Tüketimi Yönetim Paneli
      </Typography>
      <Typography variant="body1">
        Hoş geldiniz! Bu panel üzerinden kullanıcıları ve su tüketim verilerini yönetebilirsiniz.
      </Typography>
    </Container>
  );
};

export default Dashboard; 