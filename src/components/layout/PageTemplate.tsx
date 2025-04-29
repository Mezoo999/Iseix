'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { FadeInView } from '@/components/ui/AnimatedElements';
import useDeviceDetect from '@/hooks/useDeviceDetect';

interface PageTemplateProps {
  children: ReactNode;
  title: string;
  description?: string;
  icon?: ReactNode;
  showDate?: boolean;
  gradientColors?: {
    from: string;
    to: string;
  };
  className?: string;
}

export default function PageTemplate({
  children,
  title,
  description,
  icon,
  showDate = false,
  gradientColors = { from: 'from-primary', to: 'to-primary-dark' },
  className = '',
}: PageTemplateProps) {
  const { isMobile } = useDeviceDetect();
  
  return (
    <>
      <Navbar />
      <main className={`pt-24 min-h-screen ${className}`}>
        <div className="container mx-auto px-4 py-8">
          <FadeInView direction="up" delay={0.1}>
            <div className="mb-6">
              <div className={`bg-gradient-to-r ${gradientColors.from} ${gradientColors.to} text-white p-4 rounded-xl flex items-center justify-between`}>
                <div className="flex items-center">
                  {icon && (
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ml-3">
                      {icon}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-bold">{title}</h1>
                    {description && (
                      <p className="text-white/80 text-sm">{description}</p>
                    )}
                  </div>
                </div>
                {showDate && (
                  <div className="text-sm bg-white/10 p-2 rounded-lg">
                    {new Date().toLocaleDateString('ar-SA')}
                  </div>
                )}
              </div>
            </div>
          </FadeInView>
          
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
