'use client';

import UserList from "../components/UserList";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Su Ayak İzi Dashboard</h1>
      <UserList />
    </div>
  );
} 