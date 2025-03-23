import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridValueGetter,
} from '@mui/x-data-grid';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface WaterprintData {
  id: string;
  date: string;
  totalWaterUsage: number;
  categories: {
    [key: string]: number;
  };
}

interface UserData {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const apiUrl = process.env.NODE_ENV === 'production'
          ? process.env.REACT_APP_PRODUCTION_API_URL
          : process.env.REACT_APP_API_URL;

        const response = await axios.get<UserData[]>(`${apiUrl}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Kullanıcı listesi alınamadı');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
    },
    {
      field: 'displayName',
      headerName: 'İsim',
      width: 150,
      valueGetter: (value, row: UserData) => row.displayName || '-',
    },
    {
      field: 'createdAt',
      headerName: 'Kayıt Tarihi',
      width: 200,
      valueGetter: (value, row: UserData) => {
        const date = row.createdAt;
        return date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '-';
      },
    },
    {
      field: 'lastLoginAt',
      headerName: 'Son Giriş',
      width: 200,
      valueGetter: (value, row: UserData) => {
        const date = row.lastLoginAt;
        return date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '-';
      },
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Kullanıcı Listesi
      </Typography>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row: UserData) => row.id}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              csvOptions: { 
                fileName: 'waterapp-users',
                delimiter: ';',
              },
            },
          }}
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          sx={{
            '& .MuiDataGrid-toolbarContainer': {
              padding: 2,
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default Users; 