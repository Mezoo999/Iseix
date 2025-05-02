'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaShieldAlt, FaExclamationTriangle, FaInfoCircle, FaCheck, FaUser, FaSearch, FaFilter, FaEye } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { PageLoader } from '@/components/ui/Loaders';
import { getAllSecurityEvents, SecurityEvent, getUserBasicInfo } from '@/services/securityMonitoring';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function AdminSecurityPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userInfoCache, setUserInfoCache] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // التحقق من صلاحيات المسؤول
  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!userData?.isAdmin && !userData?.isOwner) {
        router.push('/dashboard');
      }
    }
  }, [currentUser, loading, router, userData]);

  // جلب الأحداث الأمنية
  useEffect(() => {
    const fetchSecurityEvents = async () => {
      try {
        setIsLoading(true);
        const events = await getAllSecurityEvents(100);
        setSecurityEvents(events);
        setFilteredEvents(events);
        
        // جلب معلومات المستخدمين
        const userIds = [...new Set(events.map(event => event.userId))];
        const userInfoPromises = userIds.map(async (userId) => {
          const userInfo = await getUserBasicInfo(userId);
          return { userId, userInfo };
        });
        
        const userInfoResults = await Promise.all(userInfoPromises);
        const userInfoMap: Record<string, any> = {};
        
        userInfoResults.forEach(result => {
          if (result.userInfo) {
            userInfoMap[result.userId] = result.userInfo;
          }
        });
        
        setUserInfoCache(userInfoMap);
      } catch (error) {
        console.error('Error fetching security events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && (userData?.isAdmin || userData?.isOwner)) {
      fetchSecurityEvents();
    }
  }, [currentUser, userData]);

  // تصفية الأحداث الأمنية
  useEffect(() => {
    if (securityEvents.length === 0) return;
    
    let filtered = [...securityEvents];
    
    // تصفية حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // تصفية حسب الخطورة
    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }
    
    // تصفية حسب النوع
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }
    
    // تصفية حسب الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => 
        statusFilter === 'resolved' ? event.isResolved : !event.isResolved
      );
    }
    
    setFilteredEvents(filtered);
  }, [searchTerm, severityFilter, typeFilter, statusFilter, securityEvents]);

  // تنسيق التاريخ
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'غير معروف';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // الحصول على أيقونة الحدث الأمني
  const getSecurityEventIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <FaExclamationTriangle className="text-error" />;
      case 'high':
        return <FaExclamationTriangle className="text-warning" />;
      case 'medium':
        return <FaInfoCircle className="text-info" />;
      case 'low':
        return <FaInfoCircle className="text-success" />;
      default:
        return <FaInfoCircle className="text-foreground-muted" />;
    }
  };

  // الحصول على لون الحدث الأمني
  const getSecurityEventColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-error/30 bg-error/5';
      case 'high':
        return 'border-warning/30 bg-warning/5';
      case 'medium':
        return 'border-info/30 bg-info/5';
      case 'low':
        return 'border-success/30 bg-success/5';
      default:
        return 'border-foreground-muted/30 bg-foreground-muted/5';
    }
  };

  // الحصول على أنواع الأحداث الفريدة
  const getUniqueEventTypes = () => {
    const types = [...new Set(securityEvents.map(event => event.type))];
    return types;
  };

  // معالجة الحدث الأمني
  const resolveSecurityEvent = async (eventId: string) => {
    if (!eventId || !currentUser) return;
    
    try {
      setIsProcessing(true);
      
      const eventRef = doc(db, 'securityEvents', eventId);
      await updateDoc(eventRef, {
        isResolved: true,
        resolvedBy: currentUser.uid,
        resolvedAt: serverTimestamp()
      });
      
      // تحديث الواجهة
      setSecurityEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, isResolved: true, resolvedBy: currentUser.uid, resolvedAt: serverTimestamp() as any } 
            : event
        )
      );
      
      console.log(`[admin/security] تمت معالجة الحدث الأمني: ${eventId}`);
    } catch (error) {
      console.error('[admin/security] خطأ في معالجة الحدث الأمني:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // عرض معلومات المستخدم
  const getUserInfo = (userId: string) => {
    const userInfo = userInfoCache[userId];
    
    if (!userInfo) {
      return 'جاري تحميل معلومات المستخدم...';
    }
    
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm ml-2">
          <FaUser />
        </div>
        <div>
          <p className="font-bold">{userInfo.displayName}</p>
          <p className="text-xs text-foreground-muted">{userInfo.email}</p>
        </div>
      </div>
    );
  };

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading) {
    return <PageLoader />;
  }

  // إذا لم يكن هناك مستخدم أو ليس لديه صلاحيات المسؤول، لا تعرض شيئًا
  if (!currentUser || (!userData?.isAdmin && !userData?.isOwner)) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <FaShieldAlt className="ml-2 text-primary" />
            إدارة الأمان
          </h1>
        </div>

        {/* أدوات البحث والتصفية */}
        <div className="mb-6 bg-background-light/30 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4">
            {/* البحث */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="البحث عن أحداث أمنية..."
                  className="w-full p-2 pl-10 rounded-md border border-background-lighter bg-background-light"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute right-3 top-3 text-foreground-muted" />
              </div>
            </div>
            
            {/* تصفية حسب الخطورة */}
            <div className="w-full sm:w-auto">
              <select
                className="w-full p-2 rounded-md border border-background-lighter bg-background-light"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">جميع مستويات الخطورة</option>
                <option value="critical">حرجة</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>
            
            {/* تصفية حسب النوع */}
            <div className="w-full sm:w-auto">
              <select
                className="w-full p-2 rounded-md border border-background-lighter bg-background-light"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">جميع الأنواع</option>
                {getUniqueEventTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* تصفية حسب الحالة */}
            <div className="w-full sm:w-auto">
              <select
                className="w-full p-2 rounded-md border border-background-lighter bg-background-light"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="resolved">تمت المعالجة</option>
              </select>
            </div>
          </div>
        </div>

        {/* قائمة الأحداث الأمنية */}
        <div className="bg-background-light/30 p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <FaExclamationTriangle className="ml-2 text-warning" />
            الأحداث الأمنية ({filteredEvents.length})
          </h2>
          
          {isLoading ? (
            <div className="text-center p-4">
              <div className="spinner"></div>
              <p className="mt-2 text-foreground-muted">جاري تحميل الأحداث الأمنية...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 border rounded-md ${getSecurityEventColor(event.severity)}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start">
                    <div className="p-2 rounded-full bg-background-lighter ml-3 mb-2 md:mb-0">
                      {getSecurityEventIcon(event.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <h4 className="font-bold">{event.description}</h4>
                        <span className="text-xs text-foreground-muted mt-1 md:mt-0">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-foreground-muted">
                            <span className="font-bold">المستخدم:</span> {getUserInfo(event.userId)}
                          </p>
                          <p className="text-sm text-foreground-muted">
                            <span className="font-bold">نوع الحدث:</span> {event.type}
                          </p>
                          <p className="text-sm text-foreground-muted">
                            <span className="font-bold">مستوى الخطورة:</span> {event.severity}
                          </p>
                        </div>
                        
                        <div>
                          {event.metadata && (
                            <div className="text-sm text-foreground-muted">
                              <span className="font-bold">بيانات إضافية:</span>
                              <pre className="mt-1 p-2 bg-background-dark/10 rounded-md overflow-x-auto text-xs">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        {event.isResolved ? (
                          <div className="text-xs text-success flex items-center">
                            <FaCheck className="ml-1" />
                            تمت المعالجة {event.resolvedAt && `(${formatDate(event.resolvedAt)})`}
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => event.id && resolveSecurityEvent(event.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'جاري المعالجة...' : 'تحديد كمعالج'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-foreground-muted">
              لا توجد أحداث أمنية تطابق معايير البحث
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
