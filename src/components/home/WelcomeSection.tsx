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
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gradient">
                منصة Iseix للاستثمار بالذكاء الاصطناعي
              </h1>
            </FadeInView>

            <FadeInView direction="right" delay={0.2}>
              <p className="text-xl md:text-2xl mb-10 text-foreground-muted">
                استثمر بذكاء مع أحدث تقنيات الذكاء الاصطناعي. نحن نستخدم خوارزميات متطورة لتحقيق أقصى عائد على استثماراتك.
              </p>
            </FadeInView>

            <FadeInView direction="right" delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <AnimatedButton href="/register" variant="primary" size="lg">
                  ابدأ الاستثمار الآن
                </AnimatedButton>
                <AnimatedButton href="/about" variant="outline" size="lg">
                  تعرف علينا
                </AnimatedButton>
              </div>
            </FadeInView>

            <FadeInView direction="right" delay={0.4}>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary/20 text-primary inline-block mb-2">
                    <FaRocket className="text-xl" />
                  </div>
                  <p className="font-bold">سهولة البدء</p>
                </div>
                <div className="text-center">
                  <div className="p-3 rounded-full bg-success/20 text-success inline-block mb-2">
                    <FaChartLine className="text-xl" />
                  </div>
                  <p className="font-bold">أرباح يومية</p>
                </div>
                <div className="text-center">
                  <div className="p-3 rounded-full bg-info/20 text-info inline-block mb-2">
                    <FaShieldAlt className="text-xl" />
                  </div>
                  <p className="font-bold">أمان مضمون</p>
                </div>
              </div>
            </FadeInView>
          </div>

          <div className="relative">
            <FadeInView direction="left" delay={0.3}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-2xl blur-xl transform -rotate-6"></div>
                <div className="card card-primary p-8 relative">
                  <h3 className="text-2xl font-bold mb-6 text-center">كيف تبدأ الاستثمار؟</h3>

                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center ml-4 flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">أنشئ حسابك</h4>
                        <p className="text-foreground-muted text-sm">سجل حساب جديد في منصتنا بخطوات بسيطة</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center ml-4 flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">أودع الأموال</h4>
                        <p className="text-foreground-muted text-sm">أودع الأموال في محفظتك باستخدام طرق الدفع المتاحة</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center ml-4 flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">اختر خطة استثمارية</h4>
                        <p className="text-foreground-muted text-sm">اختر الخطة المناسبة لك وابدأ في تحقيق الأرباح</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center ml-4 flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">اجني الأرباح</h4>
                        <p className="text-foreground-muted text-sm">احصل على أرباحك بشكل منتظم واسحبها بسهولة</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <PulseElement>
                      <AnimatedButton href="/register" variant="primary">
                        ابدأ الآن
                      </AnimatedButton>
                    </PulseElement>
                  </div>
                </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </div>
    </section>
  );
}
