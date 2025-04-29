'use client';

import { motion } from 'framer-motion';
import { FaChartLine, FaUsers, FaMoneyBillWave, FaPercentage, FaHandHoldingUsd, FaUserTie } from 'react-icons/fa';

interface InvestmentBenefitsProps {
  showTitle?: boolean;
}

export default function InvestmentBenefits({ showTitle = true }: InvestmentBenefitsProps) {
  return (
    <motion.div
      className="glass-effect p-6 rounded-xl mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {showTitle && (
        <h2 className="text-xl font-bold mb-6">مميزات الاستثمار</h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-background-light/30 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-primary/10 ml-3">
              <FaChartLine className="text-primary text-xl" />
            </div>
            <h3 className="font-bold">الفائدة المركبة تعمل تلقائيًا</h3>
          </div>
          <p className="text-foreground-muted">
            استفد من قوة الفائدة المركبة التلقائية لتنمية رصيدك بشكل أسرع وأكثر فعالية. تضاف الفائدة يوميًا إلى رصيدك.
          </p>
        </div>

        <div className="bg-background-light/30 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-success/10 ml-3">
              <FaHandHoldingUsd className="text-success text-xl" />
            </div>
            <h3 className="font-bold">زيادة المساهمة = ربح أكبر</h3>
          </div>
          <p className="text-foreground-muted">
            كلما زادت مساهمتك، كلما حصلت على ربح أكبر. استثمر المزيد لتحقيق عوائد أعلى.
          </p>
        </div>

        <div className="bg-background-light/30 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-info/10 ml-3">
              <FaUsers className="text-info text-xl" />
            </div>
            <h3 className="font-bold">برنامج الإحالة المميز</h3>
          </div>
          <p className="text-foreground-muted">
            إذا قمت بدعوة 10 أشخاص مستوى أول و15 شخص مستوى ثاني، فسوف تصبح موظفًا دائمًا وتحصل على راتب أسبوعي.
          </p>
        </div>

        <div className="bg-background-light/30 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-warning/10 ml-3">
              <FaMoneyBillWave className="text-warning text-xl" />
            </div>
            <h3 className="font-bold">مضاعفة الأرباح</h3>
          </div>
          <p className="text-foreground-muted">
            يمكن مضاعفة الأرباح من خلال استراتيجيات الاستثمار الذكية وبرنامج الإحالة.
          </p>
        </div>

        <div className="bg-background-light/30 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-primary/10 ml-3">
              <FaPercentage className="text-primary text-xl" />
            </div>
            <h3 className="font-bold">عوائد يومية مرتفعة</h3>
          </div>
          <p className="text-foreground-muted">
            الدخل اليومي من 2.5% إلى 4.5%، مما يتيح لك تحقيق عوائد سريعة على استثماراتك.
          </p>
        </div>

        <div className="bg-background-light/30 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-success/10 ml-3">
              <FaUserTie className="text-success text-xl" />
            </div>
            <h3 className="font-bold">سهولة البدء</h3>
          </div>
          <p className="text-foreground-muted">
            الحد الأدنى للإيداع هو 20 دولار فقط، والحد الأدنى للسحب هو 3 دولار. أول سحب مجاني بدون رسوم!
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-background-light/30 rounded-lg">
        <h3 className="font-bold mb-3">تفاصيل الإيداع والسحب</h3>
        <ul className="list-disc list-inside space-y-2 text-foreground-muted">
          <li>الحد الأدنى للإيداع: <span className="font-bold text-primary">20 دولار</span></li>
          <li>الحد الأدنى للسحب: <span className="font-bold text-primary">3 دولار</span></li>
          <li>رسوم السحب: <span className="font-bold text-primary">2 دولار</span> لأي مبلغ أقل من 40 دولار</li>
          <li>رسوم السحب للمبالغ أكثر من 40 دولار: <span className="font-bold text-primary">5%</span></li>
          <li>أول سحب مجاني بدون رسوم!</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-background-light/30 rounded-lg">
        <h3 className="font-bold mb-3">مكافأة الإحالة</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">5%</div>
            <p className="text-foreground-muted">المستوى الأول</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">1%</div>
            <p className="text-foreground-muted">المستوى الثاني</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
