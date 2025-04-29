'use client';

import { motion } from 'framer-motion';
import { FaRobot, FaChartLine, FaUsers, FaShieldAlt, FaGlobe, FaMoneyBillWave } from 'react-icons/fa';

// استيراد المكونات
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ParticleBackground from '@/components/3d/ParticleBackground';
import AnimatedButton from '@/components/ui/AnimatedButton';
import FeatureCard from '@/components/ui/FeatureCard';
import PlanCard from '@/components/ui/PlanCard';
import WelcomeSection from '@/components/home/WelcomeSection';
import StatsSection from '@/components/home/StatsSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import { FadeInView } from '@/components/ui/AnimatedElements';

export default function Home() {
  // بيانات الميزات
  const features = [
    {
      icon: <FaRobot />,
      title: 'ذكاء اصطناعي متطور',
      description: 'نستخدم أحدث تقنيات الذكاء الاصطناعي لتحليل الأسواق واتخاذ قرارات استثمارية ذكية.'
    },
    {
      icon: <FaChartLine />,
      title: 'عوائد مرتفعة',
      description: 'حقق عوائد استثمارية تفوق المتوسط بفضل استراتيجياتنا المدعومة بالذكاء الاصطناعي.'
    },
    {
      icon: <FaUsers />,
      title: 'مجتمع متنامي',
      description: 'انضم إلى مجتمع من المستثمرين الناجحين واستفد من خبراتهم ونصائحهم.'
    },
    {
      icon: <FaShieldAlt />,
      title: 'أمان مضمون',
      description: 'نضمن أمان استثماراتك من خلال تقنيات التشفير المتقدمة وأنظمة الحماية المتطورة.'
    },
    {
      icon: <FaGlobe />,
      title: 'وصول عالمي',
      description: 'استثمر من أي مكان في العالم واستفد من فرص الاستثمار العالمية.'
    },
    {
      icon: <FaMoneyBillWave />,
      title: 'سحب سريع',
      description: 'سحب أرباحك بسرعة وسهولة من خلال العديد من طرق الدفع المتاحة.'
    }
  ];

  // بيانات الخطط الاستثمارية
  const plans = [
    {
      name: 'الخطة الأساسية',
      price: 100,
      duration: 'الحد الأدنى للاستثمار',
      returnRate: '8% شهريًا',
      features: [
        { text: 'مدة الاستثمار 30 يوم' },
        { text: 'سحب الأرباح شهريًا' },
        { text: 'دعم فني على مدار الساعة' },
        { text: 'لوحة تحكم مفصلة' }
      ]
    },
    {
      name: 'الخطة المتقدمة',
      price: 500,
      duration: 'الحد الأدنى للاستثمار',
      returnRate: '12% شهريًا',
      features: [
        { text: 'مدة الاستثمار 60 يوم' },
        { text: 'سحب الأرباح أسبوعيًا' },
        { text: 'دعم فني على مدار الساعة' },
        { text: 'لوحة تحكم مفصلة' },
        { text: 'مكافآت إضافية' }
      ],
      isPopular: true
    },
    {
      name: 'الخطة الاحترافية',
      price: 1000,
      duration: 'الحد الأدنى للاستثمار',
      returnRate: '15% شهريًا',
      features: [
        { text: 'مدة الاستثمار 90 يوم' },
        { text: 'سحب الأرباح يوميًا' },
        { text: 'دعم فني على مدار الساعة' },
        { text: 'لوحة تحكم مفصلة' },
        { text: 'مكافآت إضافية' },
        { text: 'مدير حساب شخصي' }
      ]
    }
  ];

  // بيانات الإحصائيات
  const stats = [
    { value: '15K+', label: 'مستخدم نشط' },
    { value: '$10M+', label: 'استثمارات مُدارة' },
    { value: '25+', label: 'دولة' },
    { value: '99.9%', label: 'وقت تشغيل' }
  ];

  return (
    <>
      {/* خلفية الجزيئات */}
      <ParticleBackground />

      {/* شريط التنقل */}
      <Navbar />

      <main className="pt-24">
        {/* قسم الترحيب */}
        <WelcomeSection />

        {/* قسم الإحصائيات */}
        <StatsSection />

        {/* قسم كيفية البدء */}
        <HowItWorksSection />

        {/* قسم الميزات */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <FadeInView direction="up">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  لماذا تختار <span className="text-gradient">Iseix</span>؟
                </h2>
                <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
                  نقدم لك منصة استثمارية متكاملة تجمع بين التكنولوجيا المتطورة والخبرة المالية
                </p>
              </FadeInView>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FadeInView key={index} direction="up" delay={index * 0.1}>
                  <div className="card card-primary h-full hover:scale-105 transition-transform duration-300">
                    <div className="p-4 rounded-full bg-primary/20 text-primary inline-block mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-foreground-muted">{feature.description}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* قسم الخطط الاستثمارية */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10"></div>

          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <FadeInView direction="up">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  خطط الاستثمار
                </h2>
                <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
                  اختر الخطة المناسبة لك وابدأ رحلتك الاستثمارية مع Iseix
                </p>
              </FadeInView>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <FadeInView key={index} direction="up" delay={index * 0.1}>
                  <div className={`card ${plan.isPopular ? 'card-primary' : 'card-secondary'} relative overflow-hidden`}>
                    {plan.isPopular && (
                      <div className="absolute top-0 left-0 bg-primary text-foreground-inverted py-1 px-4 rounded-br-lg font-bold text-sm">
                        الأكثر شيوعًا
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-gradient mb-1">
                        {plan.price} USDT
                      </div>
                      <p className="text-foreground-muted text-sm">{plan.duration}</p>
                    </div>

                    <div className="bg-background-light/30 p-3 rounded-lg text-center mb-6">
                      <span className="text-xl font-bold text-success">{plan.returnRate}</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center ml-3 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>{feature.text}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="text-center">
                      <a
                        href="/register"
                        className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-outline'} w-full`}
                      >
                        ابدأ الآن
                      </a>
                    </div>
                  </div>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* قسم الدعوة للعمل */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 -z-10"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <FadeInView direction="right">
                  <div className="card card-primary p-8 relative">
                    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-foreground-inverted" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>

                    <h3 className="text-2xl font-bold mb-4">مكافأة ترحيبية</h3>
                    <p className="text-foreground-muted mb-6">
                      سجل الآن واحصل على مكافأة ترحيبية بقيمة 10 USDT عند إيداع 100 USDT أو أكثر.
                    </p>

                    <div className="bg-background-light/30 p-4 rounded-lg mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-foreground-muted">مكافأة الإيداع الأول:</span>
                        <span className="font-bold text-success">10%</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-foreground-muted">مكافأة الإحالة:</span>
                        <span className="font-bold text-success">5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-foreground-muted">مكافأة المهام اليومية:</span>
                        <span className="font-bold text-success">حتى 3.5%</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <AnimatedButton href="/register" variant="primary" size="lg">
                        احصل على المكافأة الآن
                      </AnimatedButton>
                    </div>
                  </div>
                </FadeInView>

                <FadeInView direction="left">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    ابدأ رحلتك الاستثمارية اليوم
                  </h2>

                  <p className="text-xl mb-6 text-foreground-muted">
                    انضم إلى آلاف المستثمرين الذين يحققون أرباحًا يومية مع منصة Iseix للاستثمار الذكي.
                  </p>

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center mt-1 ml-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold">استثمار آمن ومضمون</p>
                        <p className="text-foreground-muted text-sm">نستخدم أحدث تقنيات الأمان لحماية استثماراتك</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center mt-1 ml-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold">عوائد مرتفعة</p>
                        <p className="text-foreground-muted text-sm">حقق عوائد تصل إلى 15% شهريًا على استثماراتك</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center mt-1 ml-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold">سحب سريع</p>
                        <p className="text-foreground-muted text-sm">اسحب أرباحك في أي وقت وبسرعة فائقة</p>
                      </div>
                    </li>
                  </ul>

                  <AnimatedButton href="/register" variant="primary" size="lg">
                    سجل الآن واحصل على مكافأة ترحيبية
                  </AnimatedButton>
                </FadeInView>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* التذييل */}
      <Footer />
    </>
  );
}
