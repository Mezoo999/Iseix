'use client';

import { motion } from 'framer-motion';
import { FaUserPlus, FaMoneyBillWave, FaChartLine, FaWallet } from 'react-icons/fa';
import { FadeInView } from '@/components/ui/AnimatedElements';

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  number: number;
  delay: number;
}

function Step({ icon, title, description, number, delay }: StepProps) {
  return (
    <FadeInView direction="up" delay={delay}>
      <div className="relative">
        <div className="card card-primary p-6 h-full">
          <div className="absolute -top-5 -right-5 w-12 h-12 rounded-full bg-primary text-foreground-inverted flex items-center justify-center font-bold text-lg">
            {number}
          </div>
          <div className="p-4 rounded-full bg-primary/20 text-primary inline-block mb-4">
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-foreground-muted">{description}</p>
        </div>
      </div>
    </FadeInView>
  );
}

export default function HowItWorksSection() {
  const steps = [
    {
      icon: <FaUserPlus className="text-2xl" />,
      title: 'أنشئ حسابك',
      description: 'سجل حساب جديد في منصتنا بخطوات بسيطة وسريعة. كل ما تحتاجه هو بريد إلكتروني وكلمة مرور.',
      number: 1,
      delay: 0.1
    },
    {
      icon: <FaMoneyBillWave className="text-2xl" />,
      title: 'أودع الأموال',
      description: 'أودع الأموال في محفظتك باستخدام طرق الدفع المتاحة. يمكنك البدء بمبلغ صغير والتوسع لاحقًا.',
      number: 2,
      delay: 0.2
    },
    {
      icon: <FaChartLine className="text-2xl" />,
      title: 'اختر خطة استثمارية',
      description: 'اختر الخطة المناسبة لك من بين خططنا المتنوعة وابدأ في تحقيق الأرباح مع نظام الذكاء الاصطناعي.',
      number: 3,
      delay: 0.3
    },
    {
      icon: <FaWallet className="text-2xl" />,
      title: 'اجني الأرباح',
      description: 'احصل على أرباحك بشكل منتظم واسحبها بسهولة إلى حسابك المصرفي أو محفظتك الإلكترونية.',
      number: 4,
      delay: 0.4
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <FadeInView direction="up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">كيف تبدأ الاستثمار؟</h2>
            <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
              اتبع هذه الخطوات البسيطة لبدء رحلتك الاستثمارية مع منصة Iseix
            </p>
          </FadeInView>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {steps.map((step, index) => (
            <Step
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              number={step.number}
              delay={step.delay}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <FadeInView direction="up" delay={0.5}>
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary blur-xl opacity-30 rounded-full transform scale-110"></div>
              <a
                href="/register"
                className="btn btn-primary py-3 px-8 text-lg relative"
              >
                ابدأ الاستثمار الآن
              </a>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
