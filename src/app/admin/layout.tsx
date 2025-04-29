'use client';

import { ReactNode } from 'react';
import AdminProtected from '@/components/admin/AdminProtected';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtected>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </AdminProtected>
  );
}
