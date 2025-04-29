'use client';

import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
}

export default function useDeviceDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isPortrait: true,
    isLandscape: false,
    isTouchDevice: false
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // التحقق من نوع الجهاز بناءً على عرض الشاشة
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      // التحقق من اتجاه الشاشة
      const isPortrait = height > width;
      const isLandscape = width > height;
      
      // التحقق من ما إذا كان الجهاز يدعم اللمس
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isPortrait,
        isLandscape,
        isTouchDevice
      });
    };
    
    // التحقق عند تحميل الصفحة
    checkDevice();
    
    // التحقق عند تغيير حجم النافذة
    window.addEventListener('resize', checkDevice);
    
    // التحقق عند تغيير اتجاه الشاشة
    window.addEventListener('orientationchange', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);
  
  return deviceInfo;
}
