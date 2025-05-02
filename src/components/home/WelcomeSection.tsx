'use client';

import { motion } from 'framer-motion';
import { FaRocket, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { FadeInView, PulseElement } from '@/components/ui/AnimatedElements';

export default function WelcomeSection() {
  return (
    <section className="min-h-[90vh] flex items-center relative overflow-hidden">
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <FadeInView direction="right" delay={0.1}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-gradient leading-tight">
                استثمر بذكاء مع <span className="text-primary">Iseix</span>
              </h1>
            </FadeInView>

            <FadeInView direction="right" delay={0.2}>
              <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-10 text-foreground-muted leading-relaxed">
                منصة استثمارية متكاملة تجمع بين الذكاء الاصطناعي والخبرة المالية لتحقيق أقصى عائد على استثماراتك بأمان وموثوقية.
              </p>
            </FadeInView>

            <FadeInView direction="right" delay={0.3}>
              <div className="bg-background-light/30 p-4 rounded-lg mb-6 border-r-4 border-primary">
                <p className="text-lg font-bold text-primary mb-2">ما يميزنا:</p>
                <p className="text-foreground-muted">
                  نقدم لك فرصة الاستثمار في مشاريع مختارة بعناية، مع عوائد تصل إلى 15% شهريًا، وسحب أرباح يومي، ونظام إحالات مجزي.
                </p>
              </div>
            </FadeInView>

            <FadeInView direction="right" delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 mb-6 md:mb-10">
                <AnimatedButton href="/register" variant="primary" size="lg" className="py-4 text-lg">
                  ابدأ الاستثمار الآن
                </AnimatedButton>
                <AnimatedButton href="/about" variant="outline" size="lg" className="py-4 text-lg">
                  تعرف علينا
                </AnimatedButton>
              </div>
            </FadeInView>

            <FadeInView direction="right" delay={0.4}>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center">
                  <div className="p-2 sm:p-3 rounded-full bg-primary/20 text-primary inline-block mb-2">
                    <FaRocket className="text-base sm:text-xl" />
                  </div>
                  <p className="font-bold text-sm sm:text-base">سهولة البدء</p>
                </div>
                <div className="text-center">
                  <div className="p-2 sm:p-3 rounded-full bg-success/20 text-success inline-block mb-2">
                    <FaChartLine className="text-base sm:text-xl" />
                  </div>
                  <p className="font-bold text-sm sm:text-base">أرباح يومية</p>
                </div>
                <div className="text-center">
                  <div className="p-2 sm:p-3 rounded-full bg-info/20 text-info inline-block mb-2">
                    <FaShieldAlt className="text-base sm:text-xl" />
                  </div>
                  <p className="font-bold text-sm sm:text-base">أمان مضمون</p>
                </div>
              </div>
            </FadeInView>
          </div>

          <div className="relative hidden sm:block">
            <FadeInView direction="left" delay={0.3}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-2xl blur-xl transform -rotate-6"></div>
                <div className="card card-primary p-4 sm:p-6 md:p-8 relative">
                  {/* عرض الشعار ثلاثي الأبعاد */}
                  <div className="w-full h-40 mb-4 flex justify-center items-center">
                    <div className="w-40 h-40 relative">
                      <img
                        src="/images/logo.svg"
                        alt="Iseix Logo"
                        className="w-full h-full absolute top-0 left-0 animate-pulse-slow"
                        style={{ animationDuration: '3s' }}
                      />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">كيف تبدأ الاستثمار؟</h3>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center ml-3 sm:ml-4 flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-bold mb-1 text-sm sm:text-base">أنشئ حسابك</h4>
                        <p className="text-foreground-muted text-xs sm:text-sm">سجل حساب جديد في منصتنا بخطوات بسيطة</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center ml-3 sm:ml-4 flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-bold mb-1 text-sm sm:text-base">أودع الأموال</h4>
                        <p className="text-foreground-muted text-xs sm:text-sm">أودع الأموال في محفظتك باستخدام طرق الدفع المتاحة</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center ml-3 sm:ml-4 flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-bold mb-1 text-sm sm:text-base">اختر خطة استثمارية</h4>
                        <p className="text-foreground-muted text-xs sm:text-sm">اختر الخطة المناسبة لك وابدأ في تحقيق الأرباح</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center ml-3 sm:ml-4 flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h4 className="font-bold mb-1 text-sm sm:text-base">اجني الأرباح</h4>
                        <p className="text-foreground-muted text-xs sm:text-sm">احصل على أرباحك بشكل منتظم واسحبها بسهولة</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 text-center">
                    <PulseElement>
                      <AnimatedButton href="/register" variant="primary" className="text-sm sm:text-base py-3">
                        ابدأ الآن
                      </AnimatedButton>
                    </PulseElement>
                  </div>
                </div>
              </div>
            </FadeInView>
          </div>

          {/* نسخة الجوال من كيفية البدء */}
          <div className="relative sm:hidden mt-8">
            <FadeInView direction="up" delay={0.3}>
              <div className="card card-primary p-4 relative">
                <h3 className="text-xl font-bold mb-4 text-center">كيف تبدأ الاستثمار؟</h3>

                <div className="space-y-4">
                  {[
                    { num: 1, title: 'أنشئ حسابك', desc: 'سجل حساب جديد في منصتنا بخطوات بسيطة' },
                    { num: 2, title: 'أودع الأموال', desc: 'أودع الأموال في محفظتك باستخدام طرق الدفع المتاحة' },
                    { num: 3, title: 'اختر خطة استثمارية', desc: 'اختر الخطة المناسبة لك وابدأ في تحقيق الأرباح' },
                    { num: 4, title: 'اجني الأرباح', desc: 'احصل على أرباحك بشكل منتظم واسحبها بسهولة' }
                  ].map((step, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center ml-3 flex-shrink-0">
                        {step.num}
                      </div>
                      <div>
                        <h4 className="font-bold mb-1 text-sm">{step.title}</h4>
                        <p className="text-foreground-muted text-xs">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <PulseElement>
                    <AnimatedButton href="/register" variant="primary" className="text-sm py-3">
                      ابدأ الآن
                    </AnimatedButton>
                  </PulseElement>
                </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </div>
    </section>
  );
}
