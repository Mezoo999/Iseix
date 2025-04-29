import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, auth, db } from './config';

// تحميل صورة الملف الشخصي
export const uploadProfileImage = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    // إنشاء مرجع للصورة في Storage
    const storageRef = ref(storage, `profile_images/${userId}`);
    
    // تحميل الصورة
    const snapshot = await uploadBytes(storageRef, file);
    
    // الحصول على رابط التنزيل
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // تحديث صورة الملف الشخصي في Firebase Auth
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { photoURL: downloadURL });
    }
    
    // تحديث صورة الملف الشخصي في Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { photoURL: downloadURL });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

// تحميل مستندات التحقق من الهوية
export const uploadVerificationDocument = async (
  userId: string,
  file: File,
  documentType: string
): Promise<string> => {
  try {
    // إنشاء مرجع للمستند في Storage
    const storageRef = ref(storage, `verification_documents/${userId}/${documentType}`);
    
    // تحميل المستند
    const snapshot = await uploadBytes(storageRef, file);
    
    // الحصول على رابط التنزيل
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // تحديث حالة التحقق في Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`verification.${documentType}`]: {
        url: downloadURL,
        uploadedAt: new Date(),
        status: 'pending'
      }
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading verification document:', error);
    throw error;
  }
};
