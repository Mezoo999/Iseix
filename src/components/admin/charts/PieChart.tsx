'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  colors?: string[];
  showLabels?: boolean;
  showLegend?: boolean;
  showPercentage?: boolean;
  animate?: boolean;
  className?: string;
}

export default function PieChart({
  data,
  height = 250,
  width = 250,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  showLabels = true,
  showLegend = true,
  showPercentage = true,
  animate = true,
  className = ''
}: PieChartProps) {
  const [dimensions, setDimensions] = useState({ width, height });
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // تحديث أبعاد الرسم البياني عند تغيير حجم النافذة
  useEffect(() => {
    if (!containerRef) return;

    const updateDimensions = () => {
      if (containerRef) {
        const containerWidth = containerRef.clientWidth;
        const size = Math.min(containerWidth, height);
        setDimensions({
          width: size,
          height: size
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerRef, height]);

  // التأكد من وجود بيانات
  if (!data || data.length === 0) {
    return (
      <div className={`w-full h-${height} flex items-center justify-center ${className}`}>
        لا توجد بيانات لعرضها
      </div>
    );
  }

  // حساب المجموع الكلي
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // إنشاء شرائح الدائرة
  let currentAngle = 0;
  const slices = data.map((d, i) => {
    const percentage = (d.value / total) * 100;
    const startAngle = currentAngle;
    const angle = (percentage / 100) * 360;
    currentAngle += angle;
    const endAngle = currentAngle;

    // حساب نقاط المسار
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // تحويل الزوايا إلى راديان
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    // حساب نقاط البداية والنهاية
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);

    // تحديد ما إذا كان القوس كبيرًا أم لا
    const largeArcFlag = angle > 180 ? 1 : 0;

    // إنشاء مسار القوس
    const path = `
      M ${centerX} ${centerY}
      L ${startX} ${startY}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
      Z
    `;

    // حساب موقع التسمية
    const labelRad = (startAngle + angle / 2 - 90) * (Math.PI / 180);
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(labelRad);
    const labelY = centerY + labelRadius * Math.sin(labelRad);

    return {
      path,
      percentage,
      color: d.color || colors[i % colors.length],
      label: d.label,
      labelX,
      labelY,
      startAngle,
      angle
    };
  });

  return (
    <div
      ref={setContainerRef}
      className={`w-full h-full ${className}`}
    >
      <div className="flex flex-col md:flex-row items-center">
        <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
          <svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
            {/* شرائح الدائرة */}
            {slices.map((slice, i) => (
              <motion.path
                key={i}
                d={slice.path}
                fill={slice.color}
                initial={animate ? { opacity: 0 } : { opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: animate ? i * 0.1 : 0 }}
              />
            ))}

            {/* تسميات الشرائح */}
            {showLabels && slices.map((slice, i) => (
              <motion.text
                key={`label-${i}`}
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
                initial={animate ? { opacity: 0 } : { opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: animate ? 0.5 + i * 0.1 : 0 }}
              >
                {showPercentage ? `${slice.percentage.toFixed(1)}%` : slice.label}
              </motion.text>
            ))}
          </svg>
        </div>

        {/* وسيلة الإيضاح */}
        {showLegend && (
          <div className="mt-4 md:mt-0 md:mr-4 grid grid-cols-1 gap-2">
            {data.map((d, i) => (
              <motion.div
                key={i}
                className="flex items-center"
                initial={animate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: animate ? 1 + i * 0.1 : 0 }}
              >
                <div
                  className="w-4 h-4 ml-2 rounded-sm"
                  style={{ backgroundColor: d.color || colors[i % colors.length] }}
                />
                <span className="text-sm">{d.label}</span>
                <span className="text-sm text-foreground-muted mr-2">
                  ({((d.value / total) * 100).toFixed(1)}%)
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
