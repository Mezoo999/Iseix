'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import AdminProtected from './AdminProtected';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  return (
    <AdminProtected>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto">
          <main className="p-6">
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && <p className="text-foreground-muted">{description}</p>}
            </motion.div>

            {children}
          </main>
        </div>
      </div>
    </AdminProtected>
  );
}
