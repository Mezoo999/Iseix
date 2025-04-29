'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  color?: string;
  showLabels?: boolean;
  showGrid?: boolean;
  showPoints?: boolean;
  showArea?: boolean;
  animate?: boolean;
  className?: string;
}

export default function LineChart({
  data,
  height = 250,
  width = 500,
  color = '#3b82f6',
  showLabels = true,
  showGrid = true,
  showPoints = true,
  showArea = true,
  animate = true,
  className = ''
}: LineChartProps) {
  const [dimensions, setDimensions] = useState({ width, height });
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // تحديث أبعاد الرسم البياني عند تغيير حجم النافذة
  useEffect(() => {
    if (!containerRef) return;

    const updateDimensions = () => {
      if (containerRef) {
        setDimensions({
          width: containerRef.clientWidth,
          height
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

  // حساب القيم القصوى والدنيا
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const padding = 20;
  const chartWidth = dimensions.width - padding * 2;
  const chartHeight = dimensions.height - padding * 2;

  // إنشاء نقاط الرسم البياني
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    return { x, y, ...d };
  });

  // إنشاء مسار الخط
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // إنشاء مسار المنطقة
  const areaPath = `
    ${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
    L ${points[points.length - 1].x} ${padding + chartHeight}
    L ${points[0].x} ${padding + chartHeight}
    Z
  `;

  return (
    <div
      ref={setContainerRef}
      className={`w-full h-full ${className}`}
    >
      <svg width="100%" height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
        {/* شبكة الرسم البياني */}
        {showGrid && (
          <g className="grid">
            {/* خطوط أفقية */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = padding + (i / 4) * chartHeight;
              return (
                <line
                  key={`h-${i}`}
                  x1={padding}
                  y1={y}
                  x2={padding + chartWidth}
                  y2={y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="4 4"
                />
              );
            })}
            {/* خطوط عمودية */}
            {points.map((p, i) => (
              <line
                key={`v-${i}`}
                x1={p.x}
                y1={padding}
                x2={p.x}
                y2={padding + chartHeight}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="4 4"
              />
            ))}
          </g>
        )}

        {/* منطقة تحت الخط */}
        {showArea && (
          <motion.path
            d={areaPath}
            fill={color}
            fillOpacity={0.1}
            initial={animate ? { opacity: 0 } : { opacity: 0.1 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 1 }}
          />
        )}

        {/* الخط الرئيسي */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* النقاط */}
        {showPoints && points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={color}
            initial={animate ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: animate ? 1.5 + i * 0.1 : 0 }}
          />
        ))}

        {/* التسميات */}
        {showLabels && (
          <g className="labels">
            {/* تسميات المحور السيني */}
            {points.map((p, i) => (
              <text
                key={`label-${i}`}
                x={p.x}
                y={padding + chartHeight + 15}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className="text-foreground-muted"
              >
                {p.label}
              </text>
            ))}

            {/* تسميات المحور الصادي */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = padding + (i / 4) * chartHeight;
              const value = maxValue - (i / 4) * (maxValue - minValue);
              return (
                <text
                  key={`y-label-${i}`}
                  x={padding - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="currentColor"
                  className="text-foreground-muted"
                >
                  {value.toFixed(1)}
                </text>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
