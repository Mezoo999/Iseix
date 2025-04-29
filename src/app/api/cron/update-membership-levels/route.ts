import { NextResponse } from 'next/server';
import { updateAllUsersMembershipLevels } from '@/services/referral';

/**
 * وظيفة مجدولة لتحديث مستويات العضوية لجميع المستخدمين بناءً على عدد الإحالات النشطة
 * يمكن استدعاء هذه الوظيفة من خلال Cron Job يومي
 * 
 * مثال: curl -X POST https://yourdomain.com/api/cron/update-membership-levels
 */
export async function POST(request: Request) {
  try {
    // التحقق من مفتاح API (اختياري للأمان)
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    
    // يمكنك إضافة التحقق من مفتاح API هنا
    // if (apiKey !== process.env.CRON_API_KEY) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // تحديث مستويات العضوية
    const results = await updateAllUsersMembershipLevels();
    
    return NextResponse.json({
      success: true,
      message: `تم تحديث مستويات العضوية بنجاح. تم تحديث ${results.updated} من أصل ${results.total} مستخدم.`,
      results
    });
  } catch (error) {
    console.error('Error updating membership levels:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'حدث خطأ أثناء تحديث مستويات العضوية' 
    }, { status: 500 });
  }
}

/**
 * للتوافق مع طلبات GET (اختياري)
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'استخدم طريقة POST لتحديث مستويات العضوية' 
  });
}
