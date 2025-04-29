'use client';

import { useState, useEffect } from 'react';
import { FaBell, FaSearch, FaFilter, FaTrash, FaSpinner, FaPlus, FaEdit, FaSave, FaTimes, FaUsers } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  targetUsers: string;
  isRead: boolean;
  createdAt: any;
  isEditing?: boolean;
}

export default function AdminNotifications() {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNotification, setNewNotification] = useState<Omit<Notification, 'id' | 'createdAt' | 'isRead'>>({
    title: '',
    message: '',
    type: 'info',
    targetUsers: 'all'
  });

  useEffect(() => {
    if (currentUser) {
      // التحقق من أن المستخدم هو مالك المنصة (أنت)
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      } else {
        console.log('مرحباً بك في صفحة إدارة الإشعارات');
        loadNotifications();
      }
    } else if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, router]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      
      let notificationsQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      const notificationsData: Notification[] = [];
      
      notificationsSnapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
          targetUsers: data.targetUsers || 'all',
          isRead: data.isRead || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      setNotifications(notificationsData);
      setFilteredNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = notifications;
    
    // تطبيق الفلتر
    if (filter === 'info') {
      filtered = filtered.filter(notification => notification.type === 'info');
    } else if (filter === 'success') {
      filtered = filtered.filter(notification => notification.type === 'success');
    } else if (filter === 'warning') {
      filtered = filtered.filter(notification => notification.type === 'warning');
    } else if (filter === 'error') {
      filtered = filtered.filter(notification => notification.type === 'error');
    }
    
    // تطبيق البحث
    if (searchTerm) {
      filtered = filtered.filter(
        notification =>
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredNotifications(filtered);
  }, [filter, searchTerm, notifications]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const handleAddNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      return;
    }
    
    setIsProcessing(true);
    try {
      // إضافة الإشعار إلى قاعدة البيانات
      const docRef = await addDoc(collection(db, 'notifications'), {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        targetUsers: newNotification.targetUsers,
        isRead: false,
        createdAt: serverTimestamp()
      });
      
      // تحديث الواجهة
      const newNotificationWithId: Notification = {
        id: docRef.id,
        ...newNotification,
        isRead: false,
        createdAt: new Date()
      };
      
      setNotifications([newNotificationWithId, ...notifications]);
      setFilteredNotifications([newNotificationWithId, ...filteredNotifications]);
      
      // إغلاق النافذة وإعادة تعيين النموذج
      setIsAddModalOpen(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        targetUsers: 'all'
      });
    } catch (error) {
      console.error('Error adding notification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setIsProcessing(true);
    try {
      // حذف الإشعار من قاعدة البيانات
      await deleteDoc(doc(db, 'notifications', id));
      
      // تحديث الواجهة
      setNotifications(notifications.filter(notification => notification.id !== id));
      setFilteredNotifications(filteredNotifications.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (id: string) => {
    setNotifications(
      notifications.map(notification =>
        notification.id === id ? { ...notification, isEditing: true } : notification
      )
    );
  };

  const handleCancelEdit = (id: string) => {
    setNotifications(
      notifications.map(notification =>
        notification.id === id ? { ...notification, isEditing: false } : notification
      )
    );
  };

  const handleChangeNotification = (id: string, field: string, value: any) => {
    setNotifications(
      notifications.map(notification =>
        notification.id === id ? { ...notification, [field]: value } : notification
      )
    );
  };

  const handleSaveNotification = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    
    setIsProcessing(true);
    try {
      // تحديث الإشعار في قاعدة البيانات
      await updateDoc(doc(db, 'notifications', id), {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetUsers: notification.targetUsers
      });
      
      // تحديث الواجهة
      setNotifications(
        notifications.map(n =>
          n.id === id ? { ...n, isEditing: false } : n
        )
      );
    } catch (error) {
      console.error('Error updating notification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-info/20 text-info';
      case 'success':
        return 'bg-success/20 text-success';
      case 'warning':
        return 'bg-warning/20 text-warning';
      case 'error':
        return 'bg-error/20 text-error';
      default:
        return 'bg-info/20 text-info';
    }
  };

  const getTargetUsersText = (targetUsers: string) => {
    switch (targetUsers) {
      case 'all':
        return 'جميع المستخدمين';
      case 'active':
        return 'المستخدمين النشطين';
      case 'premium':
        return 'المستخدمين المميزين';
      default:
        return targetUsers;
    }
  };

  return (
    <AdminLayout
      title="إدارة الإشعارات"
      description="إرسال وإدارة الإشعارات للمستخدمين."
    >
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FaSearch className="text-foreground-muted" />
          </div>
          <input
            type="text"
            className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full md:w-80 p-3 pr-10"
            placeholder="البحث في الإشعارات..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-outline flex items-center gap-2">
              <FaFilter />
              {filter === 'all' ? 'جميع الإشعارات' : 
               filter === 'info' ? 'معلومات' : 
               filter === 'success' ? 'نجاح' : 
               filter === 'warning' ? 'تحذير' : 'خطأ'}
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-background-light rounded-box w-52 mt-2">
              <li><a onClick={() => handleFilterChange('all')} className={filter === 'all' ? 'active' : ''}>جميع الإشعارات</a></li>
              <li><a onClick={() => handleFilterChange('info')} className={filter === 'info' ? 'active' : ''}>معلومات</a></li>
              <li><a onClick={() => handleFilterChange('success')} className={filter === 'success' ? 'active' : ''}>نجاح</a></li>
              <li><a onClick={() => handleFilterChange('warning')} className={filter === 'warning' ? 'active' : ''}>تحذير</a></li>
              <li><a onClick={() => handleFilterChange('error')} className={filter === 'error' ? 'active' : ''}>خطأ</a></li>
            </ul>
          </div>

          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FaPlus />
            إضافة إشعار جديد
          </button>
        </div>
      </div>

      <div className="bg-background-light rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-background-lighter">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">الإشعارات ({filteredNotifications.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-dark text-white">
              <tr>
                <th className="py-3 px-4 text-right">العنوان</th>
                <th className="py-3 px-4 text-right">الرسالة</th>
                <th className="py-3 px-4 text-center">النوع</th>
                <th className="py-3 px-4 text-center">المستهدفين</th>
                <th className="py-3 px-4 text-center">التاريخ</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center">
                    <FaSpinner className="animate-spin inline ml-2" />
                    جاري التحميل...
                  </td>
                </tr>
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center">
                    لا توجد إشعارات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification) => (
                  <tr key={notification.id} className="border-b border-background-lighter hover:bg-background-lighter/20">
                    <td className="py-3 px-4">
                      {notification.isEditing ? (
                        <input
                          type="text"
                          className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2"
                          value={notification.title}
                          onChange={(e) => handleChangeNotification(notification.id, 'title', e.target.value)}
                        />
                      ) : (
                        <div className="font-medium">{notification.title}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {notification.isEditing ? (
                        <textarea
                          className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2"
                          value={notification.message}
                          onChange={(e) => handleChangeNotification(notification.id, 'message', e.target.value)}
                        />
                      ) : (
                        <div className="truncate max-w-xs">{notification.message}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {notification.isEditing ? (
                        <select
                          className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2"
                          value={notification.type}
                          onChange={(e) => handleChangeNotification(notification.id, 'type', e.target.value)}
                        >
                          <option value="info">معلومات</option>
                          <option value="success">نجاح</option>
                          <option value="warning">تحذير</option>
                          <option value="error">خطأ</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${getTypeClass(notification.type)}`}>
                          {notification.type === 'info' ? 'معلومات' :
                           notification.type === 'success' ? 'نجاح' :
                           notification.type === 'warning' ? 'تحذير' : 'خطأ'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {notification.isEditing ? (
                        <select
                          className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2"
                          value={notification.targetUsers}
                          onChange={(e) => handleChangeNotification(notification.id, 'targetUsers', e.target.value)}
                        >
                          <option value="all">جميع المستخدمين</option>
                          <option value="active">المستخدمين النشطين</option>
                          <option value="premium">المستخدمين المميزين</option>
                        </select>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {getTargetUsersText(notification.targetUsers)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {new Date(notification.createdAt).toLocaleString('ar-SA')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {notification.isEditing ? (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <button
                            className="p-1 text-success hover:bg-success/10 rounded"
                            onClick={() => handleSaveNotification(notification.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <FaSpinner className="animate-spin" /> : <FaSave />}
                          </button>
                          <button
                            className="p-1 text-error hover:bg-error/10 rounded"
                            onClick={() => handleCancelEdit(notification.id)}
                            disabled={isProcessing}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <button
                            className="p-1 text-primary hover:bg-primary/10 rounded"
                            onClick={() => handleEdit(notification.id)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="p-1 text-error hover:bg-error/10 rounded"
                            onClick={() => handleDeleteNotification(notification.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة إضافة إشعار جديد */}
      <div className={`modal ${isAddModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">إضافة إشعار جديد</h3>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">العنوان</label>
            <input
              type="text"
              className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
              placeholder="أدخل عنوان الإشعار"
              value={newNotification.title}
              onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">الرسالة</label>
            <textarea
              className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
              placeholder="أدخل رسالة الإشعار"
              value={newNotification.message}
              onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">النوع</label>
            <select
              className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
              value={newNotification.type}
              onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
            >
              <option value="info">معلومات</option>
              <option value="success">نجاح</option>
              <option value="warning">تحذير</option>
              <option value="error">خطأ</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">المستهدفين</label>
            <select
              className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
              value={newNotification.targetUsers}
              onChange={(e) => setNewNotification({ ...newNotification, targetUsers: e.target.value })}
            >
              <option value="all">جميع المستخدمين</option>
              <option value="active">المستخدمين النشطين</option>
              <option value="premium">المستخدمين المميزين</option>
            </select>
          </div>
          
          <div className="bg-info/10 p-4 rounded-lg mb-4">
            <p className="text-info font-medium">معلومات هامة</p>
            <p className="text-sm">
              سيتم إرسال هذا الإشعار إلى {getTargetUsersText(newNotification.targetUsers)}. تأكد من صحة المعلومات قبل الإرسال.
            </p>
          </div>
          
          <div className="modal-action">
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              onClick={handleAddNotification}
              disabled={isProcessing || !newNotification.title || !newNotification.message}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <FaSpinner className="animate-spin ml-2" />
                  جاري الإرسال...
                </span>
              ) : (
                <span className="flex items-center">
                  <FaBell className="ml-2" />
                  إرسال الإشعار
                </span>
              )}
            </button>
            
            <button
              className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light transition-colors"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isProcessing}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
