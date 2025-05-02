'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, Canvas } from '@react-three/fiber';
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

interface Logo3DProps {
  mouse: MouseProps;
}

// مكون الشعار ثلاثي الأبعاد
const LogoModel = ({ mouse }: Logo3DProps) => {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);

  // تحديث موضع الضوء بناءً على حركة الماوس
  useFrame(() => {
    if (light.current && mouse.x.get() !== 0 && mouse.y.get() !== 0) {
      light.current.position.x = mouse.x.get() * 5;
      light.current.position.y = mouse.y.get() * 5;
    }

    if (group.current) {
      // دوران بطيء للشعار
      group.current.rotation.y += 0.005;

      // تأثير تمايل خفيف بناءً على حركة الماوس
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        mouse.y.get() * 0.2,
        0.05
      );
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        -mouse.x.get() * 0.2,
        0.05
      );
    }
  });

  return (
    <>
      <pointLight ref={light} distance={20} intensity={15} color="#3B82F6" />
      <ambientLight intensity={0.5} />

      <group ref={group}>
        {/* الدائرة الخارجية */}
        <mesh position={[0, 0, -0.1]}>
          <ringGeometry args={[1.8, 2, 32]} />
          <meshStandardMaterial color="#3B82F6" />
        </mesh>

        {/* خلفية الشعار */}
        <mesh position={[0, 0, -0.2]}>
          <circleGeometry args={[1.8, 32]} />
          <meshStandardMaterial color="#1E3A8A" />
        </mesh>

        {/* حرف I */}
        <mesh position={[-0.8, 0, 0]}>
          <boxGeometry args={[0.4, 1.2, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {/* حرف S */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.4, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.4, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.2, 0.15, 0]}>
            <boxGeometry args={[0.1, 0.3, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.2, -0.15, 0]}>
            <boxGeometry args={[0.1, 0.3, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>

        {/* حرف E */}
        <group position={[0.8, 0, 0]}>
          <mesh position={[-0.15, 0, 0]}>
            <boxGeometry args={[0.1, 1.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.05, 0.5, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.05, -0.5, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>

        {/* نقاط توهج */}
        <mesh position={[-0.8, 0.8, 0.1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, 0.8, 0.1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.8, 0.8, 0.1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={2} />
        </mesh>
      </group>
    </>
  );
};

// المكون الرئيسي للشعار ثلاثي الأبعاد - تم تعديله ليعمل داخل Canvas موجود
const Logo3D = ({ mouse }: { mouse?: MouseProps }) => {
  // إذا لم يتم تمرير mouse، استخدم قيم افتراضية
  const defaultMouse = {
    x: { get: () => 0 },
    y: { get: () => 0 }
  };

  const actualMouse = mouse || defaultMouse;

  return <LogoModel mouse={actualMouse} />;
};

export default Logo3D;
