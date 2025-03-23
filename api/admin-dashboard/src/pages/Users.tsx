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
  GridValueGetterParams as BaseGridValueGetterParams,
  GridRenderCellParams,
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
  uid: string;
  email: string;
  displayName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  waterprintData?: WaterprintData[];
}

interface GridValueGetterParams extends BaseGridValueGetterParams {
  row: UserData;
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
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'displayName', headerName: 'İsim', width: 150 },
    {
      field: 'createdAt',
      headerName: 'Kayıt Tarihi',
      width: 180,
      valueGetter: (params: GridValueGetterParams) =>
        format(new Date(params.row.createdAt), 'dd.MM.yyyy HH:mm'),
    },
    {
      field: 'lastLoginAt',
      headerName: 'Son Giriş',
      width: 180,
      valueGetter: (params: GridValueGetterParams) =>
        params.row.lastLoginAt
          ? format(new Date(params.row.lastLoginAt), 'dd.MM.yyyy HH:mm')
          : '-',
    },
    {
      field: 'totalEntries',
      headerName: 'Toplam Kayıt',
      width: 130,
      valueGetter: (params: GridValueGetterParams) =>
        params.row.waterprintData?.length || 0,
    },
    {
      field: 'averageUsage',
      headerName: 'Ort. Su Tüketimi',
      width: 150,
      valueGetter: (params: GridValueGetterParams) => {
        const data = params.row.waterprintData || [];
        if (data.length === 0) return 0;
        const total = data.reduce((sum: number, entry: WaterprintData) => sum + entry.totalWaterUsage, 0);
        return Math.round(total / data.length);
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
          getRowId={(row: UserData) => row.uid}
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