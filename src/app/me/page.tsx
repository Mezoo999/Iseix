'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/Loaders';

export default function MePage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // تجنب التوجيه المتكرر
    if (!isRedirecting) {
      setIsRedirecting(true);
      // توجيه المستخدم إلى صفحة dashboard
      router.replace('/dashboard');
    }
  }, [router, isRedirecting]);

  // عرض شاشة التحميل أثناء التوجيه
  return <PageLoader />;
}
