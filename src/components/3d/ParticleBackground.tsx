'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';

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

  // إنشاء الجزيئات
  const particlesPosition = new Float32Array(count * 3);
  const particlesScale = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    particlesPosition[i3] = (Math.random() - 0.5) * 10;
    particlesPosition[i3 + 1] = (Math.random() - 0.5) * 10;
    particlesPosition[i3 + 2] = (Math.random() - 0.5) * 10;
    particlesScale[i] = Math.random();
  }

  // تحديث موضع الضوء بناءً على حركة الماوس
  useFrame(() => {
    if (light.current && mouse.x.get() !== 0 && mouse.y.get() !== 0) {
      light.current.position.x = mouse.x.get() * 10;
      light.current.position.y = mouse.y.get() * 10;
    }

    if (mesh.current) {
      mesh.current.rotation.x += 0.001;
      mesh.current.rotation.y += 0.001;
    }
  });

  return (
    <>
      <pointLight ref={light} distance={20} intensity={15} color="#3B82F6" />
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={particlesPosition}
            itemSize={3}
            args={[particlesPosition, 3]}
          />
          <bufferAttribute
            attach="attributes-scale"
            count={count}
            array={particlesScale}
            itemSize={1}
            args={[particlesScale, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#3B82F6"
        />
      </points>
    </>
  );
};

// مكون الكرة المتوهجة
const GlowingSphere = ({ mouse }: { mouse: MouseProps }) => {
  const mesh = useRef<THREE.Mesh>(null);

  // تحديث موضع الكرة بناءً على حركة الماوس
  useFrame(() => {
    if (mesh.current) {
      mesh.current.position.x = THREE.MathUtils.lerp(
        mesh.current.position.x,
        mouse.x.get() * 2,
        0.1
      );
      mesh.current.position.y = THREE.MathUtils.lerp(
        mesh.current.position.y,
        mouse.y.get() * 2,
        0.1
      );
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color="#3B82F6"
        emissive="#3B82F6"
        emissiveIntensity={2}
        transparent
        opacity={0.6}
      />
    </mesh>
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
        <GlowingSphere mouse={{ x: normalizedMouseX, y: normalizedMouseY }} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
