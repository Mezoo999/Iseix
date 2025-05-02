'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUsers, FaCopy, FaCheckCircle, FaUserPlus, FaInfoCircle, FaNetworkWired, FaShareAlt, FaLink,
         FaWhatsapp, FaTelegram, FaFacebook, FaTwitter, FaEnvelope, FaQrcode, FaCoins, FaDownload } from 'react-icons/fa';

import PageTemplate from '@/components/layout/PageTemplate';
import ReferralStatsCard from '@/components/referral/ReferralStatsCard';
import EnhancedReferralNetworkGraph from '@/components/referral/EnhancedReferralNetworkGraph';
import CommissionsHistory from '@/components/referral/CommissionsHistory';
import { PageLoader, CircleLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { getUserReferralCode, getUserReferrals, getUserReferralStats, Referral, ReferralStats } from '@/services/referral';
import { FadeInView } from '@/components/ui/AnimatedElements';
import Card from '@/components/ui/Card';
import ActionButton from '@/components/ui/ActionButton';
import QRCode from 'react-qr-code';

export default function ReferralsPage() {
  return (
    <AlertProvider>
      <ReferralsContent />
    </AlertProvider>
  );
}

function ReferralsContent() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const { showAlert } = useAlert();

  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // جلب رمز الإحالة وإحصائيات الإحالة
  useEffect(() => {
    const fetchReferralData = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);

        // جلب رمز الإحالة
        const code = await getUserReferralCode(currentUser.uid);
        setReferralCode(code);

        // إنشاء رابط الإحالة
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/register?ref=${code}`);

        try {
          // جلب إحالات المستخدم
          const userReferrals = await getUserReferrals(currentUser.uid);
          setReferrals(userReferrals);
        } catch (referralsError) {
          console.error('Error fetching user referrals:', referralsError);
          setReferrals([]);
        }

        try {
          // جلب إحصائيات الإحالة
          const referralStats = await getUserReferralStats(currentUser.uid);
          setStats(referralStats);
        } catch (statsError) {
          console.error('Error fetching referral stats:', statsError);
          setStats({
            totalReferrals: 0,
            activeReferrals: 0,
            pendingReferrals: 0,
            totalCommission: 0,
            currency: 'USDT',
            level1Referrals: 0,
            level2Referrals: 0,
            level3Referrals: 0,
            level4Referrals: 0,
            level5Referrals: 0,
            level6Referrals: 0
          });
        }
      } catch (err) {
        console.error('Error fetching referral data:', err);
        setError('حدث خطأ أثناء جلب بيانات الإحالة');
        showAlert('error', 'حدث خطأ أثناء تحميل بيانات الإحالات');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchReferralData();
    }
  }, [currentUser]);

  // نسخ رابط الإحالة
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    showAlert('success', 'تم نسخ رابط الإحالة بنجاح');
    setTimeout(() => setIsCopied(false), 3000);
  };

  // تنسيق التاريخ
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';

    const date = timestamp.toDate();
    return date.toLocaleDateString('ar-EG');
  };

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading || isLoading) {
    return <PageLoader />;
  }

  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }

  // استخدام بيانات افتراضية إذا لم تكن هناك بيانات
  if (!stats) {
    setStats({
      totalReferrals: 0,
      activeReferrals: 0,
      pendingReferrals: 0,
      totalCommission: 0,
      currency: 'USDT',
      level1Referrals: 0,
      level2Referrals: 0,
      level3Referrals: 0,
      level4Referrals: 0,
      level5Referrals: 0,
      level6Referrals: 0
    });
  }

  return (
    <PageTemplate
      title="برنامج الإحالة"
      icon={<FaUsers className="text-white text-xl" />}
    >
      {error && (
        <Card
          className="mb-6"
          variant="error"
        >
          {error}
        </Card>
      )}

      <Card
        className="mb-6"
        variant="info"
        icon={<FaInfoCircle />}
        title="ادعُ أصدقاءك واكسب عمولات"
        delay={0.2}
      >
        <p className="text-sm">
          شارك رمز الإحالة الخاص بك مع أصدقائك وعائلتك واحصل على عمولات من إيداعاتهم وأرباحهم
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          {currentUser && (
            <FadeInView direction="up" delay={0.3}>
              <ReferralStatsCard className="mb-6" />
            </FadeInView>
          )}
        </div>

        <div>
          <Card
            className="mb-6"
            title="الأشخاص الذين دعوتهم"
            icon={<FaNetworkWired className="text-primary" />}
            delay={0.3}
          >
            {referrals.length === 0 ? (
              <div className="text-center py-8 bg-background-light/30 rounded-lg">
                <FaUserPlus className="text-primary text-4xl mx-auto mb-3 opacity-50" />
                <p className="text-foreground-muted mb-2">لم تقم بدعوة أي شخص بعد</p>
                <p className="text-sm text-foreground-muted mb-4">
                  شارك رمز الإحالة الخاص بك مع أصدقائك للحصول على عمولات
                </p>
                <button
                  className="btn btn-primary"
                  onClick={copyReferralLink}
                >
                  {isCopied ? (
                    <span className="flex items-center">
                      <FaCheckCircle className="ml-2" />
                      تم نسخ الرابط
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FaCopy className="ml-2" />
                      نسخ رابط الإحالة
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background-light/50">
                    <tr>
                      <th className="py-2 px-3 text-right">المستخدم</th>
                      <th className="py-2 px-3 text-center">الحالة</th>
                      <th className="py-2 px-3 text-left">العمولة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.filter(r => r.level === 1).map((referral) => (
                      <tr key={referral.id} className="border-b border-background-lighter">
                        <td className="py-2 px-3">
                          {referral.referredEmail}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            referral.status === 'active' ? 'bg-success/20 text-success' :
                            referral.status === 'pending' ? 'bg-warning/20 text-warning' :
                            'bg-error/20 text-error'
                          }`}>
                            {referral.status === 'active' ? 'نشط' :
                             referral.status === 'pending' ? 'معلق' : 'مكتمل'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-success font-medium text-left">
                          {referral.commission.toFixed(2)} {referral.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* قسم رابط الإحالة */}
      <Card
        className="mb-8"
        title="رابط الإحالة الخاص بك"
        icon={<FaLink className="text-primary" />}
        delay={0.4}
      >
        <div className="bg-gradient-to-br from-background-dark/50 to-background-dark/30 p-5 rounded-xl border border-primary/10 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* رمز QR */}
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold mb-3 flex items-center">
                <FaQrcode className="ml-2 text-primary" />
                رمز QR للمشاركة
              </h3>
              <div className="bg-white p-4 rounded-lg mb-2 referral-qr-code">
                <QRCode value={referralLink} size={150} />
              </div>
              <button
                className="btn btn-sm btn-outline mt-2"
                onClick={() => {
                  try {
                    // تنزيل رمز QR كصورة
                    const svg = document.querySelector(".referral-qr-code svg");
                    if (svg) {
                      // تحويل SVG إلى صورة
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement("canvas");
                      const ctx = canvas.getContext("2d");

                      // إنشاء صورة من SVG
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;

                        if (ctx) {
                          // رسم الصورة على الكانفاس
                          ctx.fillStyle = "white";
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          ctx.drawImage(img, 0, 0);

                          // تنزيل الصورة
                          try {
                            const dataUrl = canvas.toDataURL("image/png");
                            const a = document.createElement("a");
                            a.href = dataUrl;
                            a.download = "referral-qr-code.png";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          } catch (e) {
                            console.error("Error creating download link:", e);
                            showAlert('error', 'حدث خطأ أثناء تنزيل رمز QR');
                          }
                        }
                      };

                      // معالجة الأخطاء المحتملة في تحميل الصورة
                      img.onerror = () => {
                        console.error("Error loading image from SVG");
                        showAlert('error', 'حدث خطأ أثناء تحميل رمز QR');
                      };

                      // تحويل SVG إلى صورة
                      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                      const url = URL.createObjectURL(svgBlob);
                      img.src = url;
                    } else {
                      showAlert('error', 'لم يتم العثور على رمز QR');
                    }
                  } catch (error) {
                    console.error("Error downloading QR code:", error);
                    showAlert('error', 'حدث خطأ أثناء تنزيل رمز QR');
                  }
                }}
              >
                <FaDownload className="ml-1" />
                تنزيل رمز QR
              </button>
            </div>

            {/* رابط الإحالة */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <p className="text-sm text-foreground-muted mb-2 flex items-center">
                  <FaShareAlt className="ml-2 text-primary" />
                  شارك هذا الرابط مع أصدقائك للحصول على عمولات
                </p>
                <div className="bg-background-dark/50 p-4 rounded-lg border border-primary/20 text-sm font-mono overflow-x-auto flex items-center mb-3">
                  <span className="truncate">{referralLink}</span>
                </div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex justify-center"
                >
                  <ActionButton
                    variant="primary"
                    icon={isCopied ? <FaCheckCircle /> : <FaCopy />}
                    onClick={copyReferralLink}
                    className="whitespace-nowrap"
                  >
                    {isCopied ? 'تم النسخ' : 'نسخ الرابط'}
                  </ActionButton>
                </motion.div>
              </div>

              {/* أزرار المشاركة */}
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3 flex items-center">
                  <FaShareAlt className="ml-2 text-primary" />
                  مشاركة الرابط
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    className="btn btn-sm bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      const url = `https://wa.me/?text=${encodeURIComponent(`انضم إلى منصة Iseix واستثمر بذكاء! استخدم رابط الإحالة الخاص بي للتسجيل: ${referralLink}`)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <FaWhatsapp className="ml-1" />
                    واتساب
                  </button>
                  <button
                    className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => {
                      const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('انضم إلى منصة Iseix واستثمر بذكاء! استخدم رابط الإحالة الخاص بي للتسجيل:')}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <FaTelegram className="ml-1" />
                    تلجرام
                  </button>
                  <button
                    className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <FaFacebook className="ml-1" />
                    فيسبوك
                  </button>
                  <button
                    className="btn btn-sm bg-blue-400 hover:bg-blue-500 text-white"
                    onClick={() => {
                      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`انضم إلى منصة Iseix واستثمر بذكاء! استخدم رابط الإحالة الخاص بي للتسجيل: ${referralLink}`)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <FaTwitter className="ml-1" />
                    تويتر
                  </button>
                  <button
                    className="btn btn-sm bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => {
                      const url = `mailto:?subject=${encodeURIComponent('دعوة للانضمام إلى منصة Iseix')}&body=${encodeURIComponent(`مرحباً،\n\nأدعوك للانضمام إلى منصة Iseix للاستثمار الذكي.\n\nاستخدم رابط الإحالة الخاص بي للتسجيل: ${referralLink}\n\nمع تحياتي،`)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <FaEnvelope className="ml-1" />
                    البريد
                  </button>
                </div>
              </div>

              {/* نصوص جاهزة للمشاركة */}
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3 flex items-center">
                  <FaInfoCircle className="ml-2 text-primary" />
                  نصوص جاهزة للمشاركة
                </h3>
                <div className="space-y-3">
                  <div className="relative bg-background-dark/20 p-3 rounded-lg">
                    <p className="text-sm">انضم إلى منصة Iseix واستثمر بذكاء! استخدم رابط الإحالة الخاص بي للتسجيل: {referralLink}</p>
                    <button
                      className="absolute top-2 left-2 text-primary hover:text-primary-dark"
                      onClick={() => {
                        navigator.clipboard.writeText(`انضم إلى منصة Iseix واستثمر بذكاء! استخدم رابط الإحالة الخاص بي للتسجيل: ${referralLink}`);
                        showAlert('success', 'تم نسخ النص بنجاح');
                      }}
                    >
                      <FaCopy />
                    </button>
                  </div>
                  <div className="relative bg-background-dark/20 p-3 rounded-lg">
                    <p className="text-sm">أدعوك للانضمام إلى منصة Iseix للاستثمار وكسب الأرباح اليومية. سجل من خلال هذا الرابط واحصل على مكافأة ترحيبية: {referralLink}</p>
                    <button
                      className="absolute top-2 left-2 text-primary hover:text-primary-dark"
                      onClick={() => {
                        navigator.clipboard.writeText(`أدعوك للانضمام إلى منصة Iseix للاستثمار وكسب الأرباح اليومية. سجل من خلال هذا الرابط واحصل على مكافأة ترحيبية: ${referralLink}`);
                        showAlert('success', 'تم نسخ النص بنجاح');
                      }}
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* قسم شبكة الإحالات */}
      <Card
        className="mb-8"
        title="شبكة الإحالات الخاصة بك"
        icon={<FaNetworkWired className="text-primary" />}
        delay={0.5}
      >
        {referrals.length === 0 ? (
          <div className="text-center py-8 bg-gradient-to-br from-background-dark/50 to-background-dark/30 rounded-xl border border-primary/10 shadow-inner">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <FaNetworkWired className="text-primary text-5xl mx-auto mb-4 opacity-50" />
              <p className="text-foreground-muted mb-3">لم تقم بدعوة أي شخص بعد</p>
              <p className="text-sm text-foreground-muted mb-5 max-w-md mx-auto">
                شارك رمز الإحالة الخاص بك مع أصدقائك وعائلتك لبناء شبكة الإحالات الخاصة بك والحصول على عمولات
              </p>
              <ActionButton
                variant="primary"
                icon={<FaShareAlt />}
                onClick={copyReferralLink}
              >
                مشاركة رابط الإحالة
              </ActionButton>
            </motion.div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-background-dark/50 to-background-dark/30 p-5 rounded-xl border border-primary/10 shadow-inner">
            <EnhancedReferralNetworkGraph
              data={{
                id: currentUser.uid,
                name: userData.displayName || currentUser.email?.split('@')[0] || 'أنت',
                email: currentUser.email || '',
                level: 0,
                status: 'active',
                children: referrals
                  .filter(r => r.level === 1)
                  .map(ref => ({
                    id: ref.referredId, // استخدام referredId بدلاً من referredUid
                    name: ref.referredName || ref.referredEmail.split('@')[0],
                    email: ref.referredEmail,
                    level: 1,
                    status: ref.status as 'active' | 'pending' | 'inactive',
                    children: referrals
                      .filter(r => r.level === 2 && r.parentReferrerId === ref.referredId)
                      .map(childRef => ({
                        id: childRef.referredId,
                        name: childRef.referredName || childRef.referredEmail.split('@')[0],
                        email: childRef.referredEmail,
                        level: 2,
                        status: childRef.status as 'active' | 'pending' | 'inactive',
                        children: referrals
                          .filter(r => r.level === 3 && r.parentReferrerId === childRef.referredId)
                          .map(grandChildRef => ({
                            id: grandChildRef.referredId,
                            name: grandChildRef.referredName || grandChildRef.referredEmail.split('@')[0],
                            email: grandChildRef.referredEmail,
                            level: 3,
                            status: grandChildRef.status as 'active' | 'pending' | 'inactive'
                          }))
                      }))
                  }))
              }}
            />
          </div>
        )}
      </Card>

      {/* قسم سجل العمولات */}
      <Card
        className="mb-8"
        title="سجل عمولات الإحالة"
        icon={<FaCoins className="text-primary" />}
        delay={0.6}
      >
        <CommissionsHistory />
      </Card>
    </PageTemplate>
  );
}
