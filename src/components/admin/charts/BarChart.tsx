'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  color?: string;
  colors?: string[];
  showLabels?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  horizontal?: boolean;
  className?: string;
}

export default function BarChart({
  data,
  height = 250,
  width = 500,
  color = '#3b82f6',
  colors,
  showLabels = true,
  showValues = true,
  showGrid = true,
  animate = true,
  horizontal = false,
  className = ''
}: BarChartProps) {
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

  // حساب القيم القصوى
  const maxValue = Math.max(...data.map(d => d.value), 0.1); // استخدام 0.1 كحد أدنى لتجنب القسمة على صفر
  const padding = 40;
  const chartWidth = dimensions.width - padding * 2;
  const chartHeight = dimensions.height - padding * 2;

  // حساب عرض الأعمدة
  const barWidth = horizontal
    ? chartHeight / data.length * 0.7
    : chartWidth / data.length * 0.7;
  const barGap = horizontal
    ? chartHeight / data.length * 0.3
    : chartWidth / data.length * 0.3;

  // إنشاء الأعمدة
  const bars = data.map((d, i) => {
    // التأكد من أن القيمة رقم صالح
    const value = isNaN(d.value) ? 0 : d.value;
    const normalizedValue = (value / maxValue) * (horizontal ? chartWidth : chartHeight);

    const x = horizontal
      ? padding
      : padding + i * (barWidth + barGap) + barGap / 2;

    const y = horizontal
      ? padding + i * (barWidth + barGap) + barGap / 2
      : padding + chartHeight - normalizedValue;

    const width = horizontal ? normalizedValue : barWidth;
    const height = horizontal ? barWidth : normalizedValue;

    const barColor = colors ? colors[i % colors.length] : d.color || color;

    // التأكد من أن جميع القيم أرقام صالحة
    return {
      x: isNaN(x) ? padding : x,
      y: isNaN(y) ? padding : y,
      width: isNaN(width) ? 0 : width,
      height: isNaN(height) ? 0 : height,
      value,
      label: d.label,
      color: barColor
    };
  });

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
          </g>
        )}

        {/* الأعمدة */}
        {bars.map((bar, i) => (
          <motion.rect
            key={i}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill={bar.color}
            rx={4}
            ry={4}
            initial={animate
              ? { [horizontal ? 'width' : 'height']: 0 }
              : { [horizontal ? 'width' : 'height']: bar[horizontal ? 'width' : 'height'] }
            }
            animate={{ [horizontal ? 'width' : 'height']: bar[horizontal ? 'width' : 'height'] }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}

        {/* قيم الأعمدة */}
        {showValues && bars.map((bar, i) => {
          // التحقق من أن القيمة رقم صالح
          if (isNaN(bar.value)) return null;

          const valueX = horizontal
            ? bar.x + bar.width + 5
            : bar.x + bar.width / 2;

          const valueY = horizontal
            ? bar.y + bar.height / 2 + 5
            : bar.y - 10;

          // التحقق من أن الإحداثيات أرقام صالحة
          if (isNaN(valueX) || isNaN(valueY)) return null;

          return (
            <motion.text
              key={`value-${i}`}
              x={valueX.toString()} // تحويل إلى سلسلة نصية لتجنب أخطاء الخصائص
              y={valueY.toString()} // تحويل إلى سلسلة نصية لتجنب أخطاء الخصائص
              textAnchor={horizontal ? "start" : "middle"}
              dominantBaseline={horizontal ? "middle" : "auto"}
              fontSize="12"
              fill="currentColor"
              className="text-foreground"
              initial={animate ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: animate ? 0.5 + i * 0.1 : 0 }}
            >
              {bar.value.toFixed(1)}
            </motion.text>
          );
        })}

        {/* التسميات */}
        {showLabels && bars.map((bar, i) => {
          const labelX = horizontal
            ? padding - 5
            : bar.x + bar.width / 2;

          const labelY = horizontal
            ? bar.y + bar.height / 2
            : padding + chartHeight + 15;

          // التحقق من أن الإحداثيات أرقام صالحة
          if (isNaN(labelX) || isNaN(labelY)) return null;

          return (
            <text
              key={`label-${i}`}
              x={labelX.toString()} // تحويل إلى سلسلة نصية لتجنب أخطاء الخصائص
              y={labelY.toString()} // تحويل إلى سلسلة نصية لتجنب أخطاء الخصائص
              textAnchor={horizontal ? "end" : "middle"}
              dominantBaseline={horizontal ? "middle" : "auto"}
              fontSize="10"
              fill="currentColor"
              className="text-foreground-muted"
            >
              {bar.label || ''}
            </text>
          );
        })}

        {/* تسميات المحور الصادي */}
        {!horizontal && Array.from({ length: 5 }).map((_, i) => {
          const y = padding + (i / 4) * chartHeight;
          const value = maxValue - (i / 4) * maxValue;

          // التحقق من أن الإحداثيات والقيم أرقام صالحة
          if (isNaN(y) || isNaN(value)) return null;

          return (
            <text
              key={`y-label-${i}`}
              x={(padding - 5).toString()}
              y={(y + 3).toString()}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              className="text-foreground-muted"
            >
              {value.toFixed(1)}
            </text>
          );
        })}

        {/* تسميات المحور السيني للرسم الأفقي */}
        {horizontal && Array.from({ length: 5 }).map((_, i) => {
          const x = padding + (i / 4) * chartWidth;
          const value = (i / 4) * maxValue;

          // التحقق من أن الإحداثيات والقيم أرقام صالحة
          if (isNaN(x) || isNaN(value)) return null;

          return (
            <text
              key={`x-label-${i}`}
              x={x.toString()}
              y={(padding + chartHeight + 15).toString()}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              className="text-foreground-muted"
            >
              {value.toFixed(1)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
