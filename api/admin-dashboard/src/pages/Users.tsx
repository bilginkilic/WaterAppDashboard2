import React, { useEffect, useState } from 'react';
import { Container, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

interface UserData {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const apiUrl = process.env.NODE_ENV === 'production'
          ? process.env.REACT_APP_PRODUCTION_API_URL
          : process.env.REACT_APP_API_URL;

        const response = await axios.get(`${apiUrl}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Kullanıcılar
      </Typography>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row: UserData) => row.id}
          slots={{
            toolbar: GridToolbar,
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </Container>
  );
};

export default Users; 