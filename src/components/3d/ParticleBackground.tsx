'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import Logo3D from './Logo3D';

// تعريف أنواع البيانات
interface MouseProps {
  x: {
    get: () => number;
  };
  y: {
    get: () => number;
  };
}

interface ParticlesProps {
  count?: number;
  mouse: MouseProps;
}

// مكون الجزيئات
const Particles = ({ count = 2000, mouse }: ParticlesProps) => {
  const mesh = useRef<THREE.Points>(null);
  const light = useRef<THREE.PointLight>(null);
  const [time, setTime] = useState(0);

  // إنشاء الجزيئات بألوان متنوعة تعكس هوية المنصة
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = (Math.random() - 0.5) * 15;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;
    }
    return positions;
  }, [count]);

  const particlesScale = useMemo(() => {
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      scales[i] = Math.random() * 2; // جعل بعض الجسيمات أكبر
    }
    return scales;
  }, [count]);

  // إنشاء ألوان متنوعة للجسيمات
  const particlesColor = useMemo(() => {
    const colors = new Float32Array(count * 3);
    const colorOptions = [
      [0.23, 0.51, 0.96], // أزرق فاتح #3B82F6
      [0.12, 0.23, 0.54], // أزرق داكن #1E3A8A
      [0.55, 0.36, 0.96]  // أرجواني #8B5CF6
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const colorIndex = Math.floor(Math.random() * colorOptions.length);
      const color = colorOptions[colorIndex];
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];
    }
    return colors;
  }, [count]);

  // تحديث موضع الضوء والجسيمات
  useFrame(() => {
    setTime(prev => prev + 0.01);

    if (light.current && mouse.x.get() !== 0 && mouse.y.get() !== 0) {
      light.current.position.x = mouse.x.get() * 10;
      light.current.position.y = mouse.y.get() * 10;
    }

    if (mesh.current) {
      // دوران بطيء للجسيمات
      mesh.current.rotation.x = Math.sin(time * 0.1) * 0.2;
      mesh.current.rotation.y = Math.cos(time * 0.1) * 0.2;

      // تأثير تمايل خفيف بناءً على حركة الماوس
      mesh.current.rotation.z = THREE.MathUtils.lerp(
        mesh.current.rotation.z,
        mouse.x.get() * 0.2,
        0.05
      );
    }
  });

  return (
    <>
      {/* إضافة أضواء متعددة لتحسين المظهر */}
      <pointLight ref={light} distance={20} intensity={10} color="#3B82F6" />
      <pointLight position={[5, 5, 5]} distance={15} intensity={5} color="#8B5CF6" />
      <pointLight position={[-5, -5, -5]} distance={15} intensity={5} color="#1E3A8A" />

      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={particlesPosition}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-scale"
            count={count}
            array={particlesScale}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={particlesColor}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
          opacity={0.7}
        />
      </points>
    </>
  );
};

// مكون الشعار المتوهج
const GlowingLogo = ({ mouse }: { mouse: MouseProps }) => {
  // استخدام مكون الشعار ثلاثي الأبعاد مع تمرير قيم الماوس
  return (
    <Logo3D mouse={mouse} />
  );
};

// المكون الرئيسي للخلفية
const ParticleBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });

  // تنعيم حركة الماوس
  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  // تحويل قيم الماوس إلى نطاق -1 إلى 1
  const normalizedMouseX = useTransform(smoothMouseX, (value) => value / dimensions.width * 2 - 1);
  const normalizedMouseY = useTransform(smoothMouseY, (value) => -(value / dimensions.height * 2 - 1));

  // تحديث أبعاد الحاوية
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 1,
          height: containerRef.current.clientHeight || 1
        });
      }
    };

    // تحديث الأبعاد عند التحميل
    updateDimensions();

    // تحديث الأبعاد عند تغيير حجم النافذة
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // إضافة مستمع لحركة الماوس
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // استخدام requestAnimationFrame لتحسين الأداء وتجنب التحديثات المتكررة
      requestAnimationFrame(() => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full -z-10 overflow-hidden"
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.2} />
        <Particles count={2000} mouse={{ x: normalizedMouseX, y: normalizedMouseY }} />
        <GlowingLogo mouse={{ x: normalizedMouseX, y: normalizedMouseY }} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
