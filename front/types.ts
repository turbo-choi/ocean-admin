import React from 'react';

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface Transaction {
  id: string;
  user: User;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Processing' | 'Failed';
}

export interface Activity {
  id: string;
  type: 'user' | 'system' | 'upload' | 'alert';
  title: React.ReactNode;
  time: string;
  description?: string;
}

export interface StatData {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: React.ReactNode;
  color: 'ocean' | 'green' | 'red' | 'purple';
}