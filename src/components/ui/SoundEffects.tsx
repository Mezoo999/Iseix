'use client';

import { useEffect, useRef, useState } from 'react';

type SoundType = 'success' | 'error' | 'notification' | 'click' | 'complete';

// مسارات ملفات الصوت
const soundPaths = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  notification: '/sounds/notification.mp3',
  click: '/sounds/click.mp3',
  complete: '/sounds/complete.mp3'
};

// مكون لتشغيل الأصوات
export function useSoundEffects() {
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    success: null,
    error: null,
    notification: null,
    click: null,
    complete: null
  });
  
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('soundMuted');
      return savedMute ? savedMute === 'true' : false;
    }
    return false;
  });
  
  // تهيئة عناصر الصوت
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // إنشاء عناصر الصوت
    Object.entries(soundPaths).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.5;
      audioRefs.current[key as SoundType] = audio;
    });
    
    return () => {
      // تنظيف عناصر الصوت
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);
  
  // حفظ حالة كتم الصوت
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', isMuted.toString());
    }
  }, [isMuted]);
  
  // تشغيل صوت
  const playSound = (type: SoundType) => {
    if (isMuted || typeof window === 'undefined') return;
    
    const audio = audioRefs.current[type];
    if (audio) {
      // إعادة تعيين الصوت للسماح بتشغيله مرة أخرى
      audio.pause();
      audio.currentTime = 0;
      
      // تشغيل الصوت
      const playPromise = audio.play();
      
      // التعامل مع الوعد لتجنب الأخطاء
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing sound:', error);
        });
      }
    }
  };
  
  // تبديل حالة كتم الصوت
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };
  
  return { playSound, isMuted, toggleMute };
}

// مكون لعرض زر كتم الصوت
export function SoundToggle() {
  const { isMuted, toggleMute } = useSoundEffects();
  
  return (
    <button
      className="p-2 rounded-full bg-background-light hover:bg-background-lighter transition-colors"
      onClick={toggleMute}
      aria-label={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
    >
      {isMuted ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

// مكون لتشغيل الأصوات تلقائيًا عند عرض التنبيهات
export function AlertSoundEffect({ type }: { type: 'success' | 'error' | 'warning' | 'info' }) {
  const { playSound } = useSoundEffects();
  
  useEffect(() => {
    // تحديد نوع الصوت بناءً على نوع التنبيه
    switch (type) {
      case 'success':
        playSound('success');
        break;
      case 'error':
        playSound('error');
        break;
      case 'warning':
      case 'info':
        playSound('notification');
        break;
    }
  }, [type, playSound]);
  
  return null;
}
