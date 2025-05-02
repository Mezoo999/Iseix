'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaUserPlus, FaUsers, FaFilter, FaSearch, FaInfoCircle } from 'react-icons/fa';

interface ReferralNode {
  id: string;
  name: string;
  email: string;
  level: number;
  status: 'active' | 'pending' | 'inactive';
  children?: ReferralNode[];
}

interface EnhancedReferralNetworkGraphProps {
  data: ReferralNode;
  className?: string;
}

const NODE_SIZE = 60;
const LEVEL_HEIGHT = 120;
const HORIZONTAL_SPACING = 100;

const EnhancedReferralNetworkGraph: React.FC<EnhancedReferralNetworkGraphProps> = ({ 
  data,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ReferralNode | null>(null);
  const [maxLevels, setMaxLevels] = useState<number>(3);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredData, setFilteredData] = useState<ReferralNode>(data);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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

  // تصفية البيانات بناءً على المعايير المحددة
  useEffect(() => {
    // نسخة عميقة من البيانات الأصلية
    const deepClone = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      const copy = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          (copy as any)[key] = deepClone(obj[key]);
        }
      }
      return copy;
    };

    const clonedData = deepClone(data);

    // تصفية العقد بناءً على الحالة والبحث
    const filterNode = (node: ReferralNode): ReferralNode | null => {
      // تصفية حسب الحالة
      if (statusFilter !== 'all' && node.status !== statusFilter) {
        return null;
      }

      // تصفية حسب البحث
      if (searchTerm && !(
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.email.toLowerCase().includes(searchTerm.toLowerCase())
      )) {
        return null;
      }

      // تصفية العقد الفرعية
      if (node.children && node.children.length > 0) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter(Boolean) as ReferralNode[];
        
        return {
          ...node,
          children: filteredChildren
        };
      }

      return node;
    };

    // تطبيق التصفية على العقدة الجذر
    const rootNode = filterNode(clonedData);
    
    // إذا كانت العقدة الجذر محذوفة، استخدم البيانات الأصلية
    setFilteredData(rootNode || clonedData);
  }, [data, statusFilter, searchTerm]);

  // تحويل البيانات إلى هيكل مسطح للرسم
  const flattenNodes = (node: ReferralNode, level = 0, parent: string | null = null, index = 0, totalSiblings = 1): any[] => {
    if (level > maxLevels) return [];

    // حساب موضع العقدة أفقياً
    let horizontalPosition;
    
    if (level === 0) {
      // العقدة الجذر في المنتصف
      horizontalPosition = dimensions.width / 2;
    } else {
      // توزيع العقد الفرعية بشكل متساوٍ
      const childrenWidth = dimensions.width * 0.8; // استخدام 80% من العرض
      const startX = (dimensions.width - childrenWidth) / 2;
      const step = childrenWidth / (totalSiblings + 1);
      horizontalPosition = startX + step * (index + 1);
    }
    
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
  const flatNodes = flattenNodes(filteredData);

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

  // معالج النقر على العقدة
  const handleNodeClick = (node: ReferralNode) => {
    setSelectedNode(node === selectedNode ? null : node);
  };

  // تكبير/تصغير الرسم البياني
  const handleZoom = (factor: number) => {
    setZoomLevel(Math.max(0.5, Math.min(2, zoomLevel + factor)));
  };

  return (
    <div className={`${className}`}>
      {/* أدوات التحكم */}
      <div className="mb-4 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {/* تصفية حسب الحالة */}
          <select
            className="select select-sm select-bordered"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="pending">معلق</option>
            <option value="inactive">غير نشط</option>
          </select>
          
          {/* تحديد عدد المستويات */}
          <select
            className="select select-sm select-bordered"
            value={maxLevels}
            onChange={(e) => setMaxLevels(parseInt(e.target.value))}
          >
            <option value="1">المستوى الأول</option>
            <option value="2">المستوى الثاني</option>
            <option value="3">المستوى الثالث</option>
          </select>
          
          {/* البحث */}
          <div className="relative">
            <input
              type="text"
              placeholder="بحث..."
              className="input input-sm input-bordered pl-8 pr-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute right-3 top-2.5 text-foreground-muted" />
          </div>
        </div>
        
        {/* أزرار التكبير/التصغير */}
        <div className="flex gap-2">
          <button
            className="btn btn-sm btn-circle"
            onClick={() => handleZoom(-0.1)}
            disabled={zoomLevel <= 0.5}
          >
            -
          </button>
          <button
            className="btn btn-sm btn-circle"
            onClick={() => handleZoom(0.1)}
            disabled={zoomLevel >= 2}
          >
            +
          </button>
        </div>
      </div>
      
      {/* الرسم البياني */}
      <div className="w-full overflow-x-auto bg-background-dark/20 rounded-lg p-4">
        {flatNodes.length > 1 ? (
          <div className="relative">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="mx-auto"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
            >
              {/* الروابط بين العقد */}
              {links.map((link, index) => (
                <motion.path
                  key={`link-${index}`}
                  d={`M${link.source.x},${link.source.y} C${link.source.x},${(link.source.y + link.target.y) / 2} ${link.target.x},${(link.source.y + link.target.y) / 2} ${link.target.x},${link.target.y}`}
                  fill="none"
                  stroke={hoveredNode === link.target.id || hoveredNode === link.source.id || 
                          (selectedNode && (selectedNode.id === link.target.id || selectedNode.id === link.source.id)) 
                          ? 'var(--primary)' : 'rgba(59, 130, 246, 0.3)'}
                  strokeWidth={hoveredNode === link.target.id || hoveredNode === link.source.id || 
                              (selectedNode && (selectedNode.id === link.target.id || selectedNode.id === link.source.id)) 
                              ? 3 : 2}
                  strokeDasharray={hoveredNode === link.target.id || hoveredNode === link.source.id || 
                                  (selectedNode && (selectedNode.id === link.target.id || selectedNode.id === link.source.id)) 
                                  ? '0' : '5,5'}
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
                  onClick={() => handleNodeClick(node)}
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
                    stroke={hoveredNode === node.id || selectedNode?.id === node.id ? 'white' : 'transparent'}
                    strokeWidth={2}
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: 1,
                      boxShadow: hoveredNode === node.id || selectedNode?.id === node.id ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
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
                    fontWeight={hoveredNode === node.id || selectedNode?.id === node.id ? 'bold' : 'normal'}
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
            
            {/* معلومات العقدة المحددة */}
            {selectedNode && (
              <motion.div
                className="absolute top-4 right-4 bg-background-light/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-primary/20 max-w-xs"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-background-dark/30 ml-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: getNodeColor(selectedNode.status) }}>
                      {getNodeIcon(selectedNode.level)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold">{selectedNode.name || selectedNode.email.split('@')[0]}</h4>
                    <p className="text-sm text-foreground-muted">{selectedNode.email}</p>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedNode.status === 'active' ? 'bg-success/10 text-success' :
                        selectedNode.status === 'pending' ? 'bg-warning/10 text-warning' :
                        'bg-error/10 text-error'
                      }`}>
                        {selectedNode.status === 'active' ? 'نشط' :
                         selectedNode.status === 'pending' ? 'معلق' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-sm">
                  <p><span className="font-bold">المستوى:</span> {selectedNode.level === 0 ? 'أنت' : `المستوى ${selectedNode.level}`}</p>
                  {selectedNode.children && (
                    <p><span className="font-bold">الإحالات المباشرة:</span> {selectedNode.children.length}</p>
                  )}
                </div>
                
                <button
                  className="mt-3 text-xs text-primary hover:underline"
                  onClick={() => setSelectedNode(null)}
                >
                  إغلاق
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaUsers className="text-primary text-5xl mx-auto mb-4 opacity-50" />
            <p className="text-foreground-muted mb-3">لا توجد إحالات تطابق معايير البحث</p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                إعادة ضبط التصفية
              </button>
            ) : (
              <p className="text-sm text-foreground-muted">
                قم بدعوة أصدقائك لبناء شبكة الإحالات الخاصة بك
              </p>
            )}
          </div>
        )}
      </div>
      
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
      
      {/* نصائح */}
      <div className="mt-4 text-center">
        <p className="text-xs text-foreground-muted flex items-center justify-center">
          <FaInfoCircle className="ml-1" />
          انقر على أي عقدة لعرض المزيد من المعلومات
        </p>
      </div>
    </div>
  );
};

export default EnhancedReferralNetworkGraph;
