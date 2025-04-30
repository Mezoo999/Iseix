'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaUserPlus, FaUsers } from 'react-icons/fa';

interface ReferralNode {
  id: string;
  name: string;
  email: string;
  level: number;
  status: 'active' | 'pending' | 'inactive';
  children?: ReferralNode[];
}

interface ReferralNetworkGraphProps {
  data: ReferralNode;
  maxLevels?: number;
}

const NODE_SIZE = 60;
const LEVEL_HEIGHT = 120;
const HORIZONTAL_SPACING = 100;

const ReferralNetworkGraph: React.FC<ReferralNetworkGraphProps> = ({ 
  data, 
  maxLevels = 3 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // تحديث أبعاد الرسم البياني عند تغيير حجم النافذة
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect();
        setDimensions({
          width,
          height: (maxLevels + 1) * LEVEL_HEIGHT
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [maxLevels]);

  // تحويل البيانات إلى هيكل مسطح للرسم
  const flattenNodes = (node: ReferralNode, level = 0, parent: string | null = null, index = 0, totalSiblings = 1): any[] => {
    if (level > maxLevels) return [];

    // حساب موضع العقدة أفقياً
    const horizontalPosition = dimensions.width / 2;
    
    // حساب موضع العقدة رأسياً
    const verticalPosition = level * LEVEL_HEIGHT + NODE_SIZE;

    const result = [
      {
        ...node,
        x: horizontalPosition,
        y: verticalPosition,
        parent,
        level
      }
    ];

    // إضافة العقد الفرعية إذا وجدت
    if (node.children && node.children.length > 0) {
      const childrenNodes = node.children.flatMap((child, childIndex) =>
        flattenNodes(
          child,
          level + 1,
          node.id,
          childIndex,
          node.children?.length || 0
        )
      );
      return [...result, ...childrenNodes];
    }

    return result;
  };

  // تحويل البيانات إلى هيكل مسطح
  const flatNodes = flattenNodes(data);

  // إنشاء الروابط بين العقد
  const links = flatNodes
    .filter(node => node.parent)
    .map(node => {
      const parent = flatNodes.find(n => n.id === node.parent);
      return parent ? { source: parent, target: node } : null;
    })
    .filter(Boolean);

  // تحديد لون العقدة بناءً على حالتها
  const getNodeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'var(--success)';
      case 'pending':
        return 'var(--warning)';
      case 'inactive':
        return 'var(--error)';
      default:
        return 'var(--primary)';
    }
  };

  // تحديد أيقونة العقدة بناءً على مستواها
  const getNodeIcon = (level: number) => {
    if (level === 0) return <FaUsers className="text-white text-xl" />;
    return <FaUser className="text-white text-lg" />;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="mx-auto"
      >
        {/* الروابط بين العقد */}
        {links.map((link, index) => (
          <motion.path
            key={`link-${index}`}
            d={`M${link.source.x},${link.source.y} C${link.source.x},${(link.source.y + link.target.y) / 2} ${link.target.x},${(link.source.y + link.target.y) / 2} ${link.target.x},${link.target.y}`}
            fill="none"
            stroke={hoveredNode === link.target.id || hoveredNode === link.source.id ? 'var(--primary)' : 'rgba(59, 130, 246, 0.3)'}
            strokeWidth={hoveredNode === link.target.id || hoveredNode === link.source.id ? 3 : 2}
            strokeDasharray={hoveredNode === link.target.id || hoveredNode === link.source.id ? '0' : '5,5'}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: index * 0.1 }}
          />
        ))}

        {/* العقد */}
        {flatNodes.map((node, index) => (
          <g
            key={`node-${node.id}`}
            transform={`translate(${node.x - NODE_SIZE / 2}, ${node.y - NODE_SIZE / 2})`}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* دائرة خلفية للتأثير */}
            <motion.circle
              cx={NODE_SIZE / 2}
              cy={NODE_SIZE / 2}
              r={NODE_SIZE / 2 + 5}
              fill={`${getNodeColor(node.status)}20`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
            
            {/* دائرة العقدة */}
            <motion.circle
              cx={NODE_SIZE / 2}
              cy={NODE_SIZE / 2}
              r={NODE_SIZE / 2}
              fill={getNodeColor(node.status)}
              stroke={hoveredNode === node.id ? 'white' : 'transparent'}
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                boxShadow: hoveredNode === node.id ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
            
            {/* أيقونة العقدة */}
            <foreignObject
              x={NODE_SIZE / 4}
              y={NODE_SIZE / 4}
              width={NODE_SIZE / 2}
              height={NODE_SIZE / 2}
            >
              <div className="flex items-center justify-center w-full h-full">
                {getNodeIcon(node.level)}
              </div>
            </foreignObject>
            
            {/* اسم العقدة */}
            <motion.text
              x={NODE_SIZE / 2}
              y={NODE_SIZE + 20}
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize="12"
              fontWeight={hoveredNode === node.id ? 'bold' : 'normal'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
            >
              {node.name || node.email.split('@')[0]}
            </motion.text>
          </g>
        ))}
        
        {/* تسميات المستويات */}
        {Array.from({ length: maxLevels + 1 }).map((_, level) => (
          <motion.text
            key={`level-${level}`}
            x={20}
            y={level * LEVEL_HEIGHT + NODE_SIZE}
            fill="var(--foreground-muted)"
            fontSize="12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: level * 0.1 }}
          >
            {level === 0 ? 'أنت' : `المستوى ${level}`}
          </motion.text>
        ))}
      </svg>
      
      {/* مفتاح الألوان */}
      <div className="flex justify-center mt-4 space-x-4 space-x-reverse">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-success ml-1"></div>
          <span className="text-xs text-foreground-muted">نشط</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-warning ml-1"></div>
          <span className="text-xs text-foreground-muted">معلق</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-error ml-1"></div>
          <span className="text-xs text-foreground-muted">غير نشط</span>
        </div>
      </div>
    </div>
  );
};

export default ReferralNetworkGraph;
