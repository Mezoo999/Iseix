import { NextResponse } from 'next/server';
import { updateAllUsersMembershipLevels } from '@/services/referral';

/**
 * وظيفة لتحديث مستويات العضوية لجميع المستخدمين بناءً على عدد الإحالات النشطة
 * يمكن استدعاء هذه الوظيفة من خلال طلب API
 *
 * مثال: POST https://yourdomain.com/api/update-membership
 */
export const dynamic = 'force-static';

export async function POST(request: Request) {
  try {
    // التحقق من مفتاح API (إلزامي للأمان)
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');

    // التحقق من مفتاح API
    const SECURE_API_KEY = "iseix_secure_api_key_2024";
    if (apiKey !== SECURE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized - Invalid API Key' }, { status: 401 });
    }

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
