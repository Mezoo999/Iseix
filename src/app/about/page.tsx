'use client';

import { motion } from 'framer-motion';
import { FaRocket, FaUsers, FaChartLine, FaShieldAlt, FaGlobe, FaHandshake } from 'react-icons/fa';
import Image from 'next/image';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ParticleBackground from '@/components/3d/ParticleBackground';
import AnimatedButton from '@/components/ui/AnimatedButton';

export default function AboutPage() {
  // بيانات فريق العمل
  const teamMembers = [
    {
      name: 'أحمد محمد',
      role: 'المؤسس والرئيس التنفيذي',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
      bio: 'خبير في مجال التكنولوجيا المالية والذكاء الاصطناعي مع أكثر من 15 عامًا من الخبرة.'
    },
    {
      name: 'سارة أحمد',
      role: 'مديرة التكنولوجيا',
      image: 'https://randomuser.me/api/portraits/women/1.jpg',
      bio: 'متخصصة في علوم البيانات والذكاء الاصطناعي مع خبرة في تطوير خوارزميات التداول.'
    },
    {
      name: 'محمد علي',
      role: 'مدير الاستثمار',
      image: 'https://randomuser.me/api/portraits/men/2.jpg',
      bio: 'محلل مالي مع خبرة 10 سنوات في إدارة الأصول والاستثمارات الاستراتيجية.'
    },
    {
      name: 'نورا حسن',
      role: 'مديرة تجربة المستخدم',
      image: 'https://randomuser.me/api/portraits/women/2.jpg',
      bio: 'مصممة واجهات مستخدم مبدعة مع شغف لإنشاء تجارب مستخدم استثنائية.'
    }
  ];

  // بيانات الشركاء
  const partners = [
    { name: 'Binance', logo: '/partners/binance.svg' },
    { name: 'TechCorp', logo: '/partners/techcorp.svg' },
    { name: 'InvestGroup', logo: '/partners/investgroup.svg' },
    { name: 'GlobalFinance', logo: '/partners/globalfinance.svg' },
    { name: 'AITech', logo: '/partners/aitech.svg' },
    { name: 'SecureInvest', logo: '/partners/secureinvest.svg' }
  ];

  // بيانات الإنجازات
  const achievements = [
    { value: '2021', label: 'تأسيس الشركة' },
    { value: '50K+', label: 'مستخدم مسجل' },
    { value: '$25M+', label: 'استثمارات مُدارة' },
    { value: '35+', label: 'دولة' }
  ];

  return (
    <>
      <ParticleBackground />
      <Navbar />
      
      <main className="pt-24">
        {/* قسم الترحيب */}
        <section className="py-16 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-6"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                عن منصة <span className="text-gradient">Iseix</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl mb-8 text-foreground-muted"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                منصة Iseix هي منصة استثمارية مبتكرة تعتمد على تقنيات الذكاء الاصطناعي المتطورة لتحقيق أقصى عوائد ممكنة للمستثمرين. نحن نجمع بين الخبرة المالية والتكنولوجيا المتقدمة لتقديم حلول استثمارية ذكية وآمنة.
              </motion.p>
            </div>
          </div>
        </section>
        
        {/* قسم قصتنا */}
        <section className="py-16 bg-background-light">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6">قصتنا</h2>
                <p className="text-foreground-muted mb-4">
                  بدأت قصة Iseix في عام 2021 عندما اجتمع فريق من الخبراء في مجالات التكنولوجيا المالية والذكاء الاصطناعي والاستثمار بهدف واحد: إنشاء منصة استثمارية تجعل الاستثمار الذكي متاحًا للجميع.
                </p>
                <p className="text-foreground-muted mb-4">
                  لاحظنا أن معظم الناس يواجهون صعوبة في الاستثمار بسبب نقص المعرفة أو الوقت أو رأس المال الكافي. لذلك، قررنا إنشاء منصة تستخدم الذكاء الاصطناعي لتحليل الأسواق واتخاذ قرارات استثمارية ذكية نيابة عن المستخدمين.
                </p>
                <p className="text-foreground-muted">
                  اليوم، تخدم منصة Iseix آلاف المستثمرين حول العالم، وتدير استثمارات بقيمة تتجاوز 25 مليون دولار، وتحقق عوائد مستدامة لعملائنا.
                </p>
              </motion.div>
              
              <motion.div
                className="glass-effect p-6 rounded-xl overflow-hidden"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <div className="aspect-video relative rounded-lg overflow-hidden">
                  {/* يمكن استبدال هذا بصورة حقيقية */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-80"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <FaRocket className="text-6xl mx-auto mb-4" />
                      <h3 className="text-2xl font-bold">رؤيتنا</h3>
                      <p className="max-w-xs mx-auto mt-2">
                        جعل الاستثمار الذكي متاحًا للجميع من خلال تقنيات الذكاء الاصطناعي المتطورة
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* قسم القيم */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <motion.h2 
                className="text-3xl font-bold mb-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                قيمنا
              </motion.h2>
              <motion.p 
                className="text-xl text-foreground-muted max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                نحن نؤمن بمجموعة من القيم الأساسية التي توجه كل ما نقوم به
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                className="glass-effect p-6 rounded-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-primary text-4xl mb-4">
                  <FaShieldAlt />
                </div>
                <h3 className="text-xl font-bold mb-3">الأمان والشفافية</h3>
                <p className="text-foreground-muted">
                  نضع أمان استثمارات عملائنا على رأس أولوياتنا. نحن نؤمن بالشفافية الكاملة في جميع معاملاتنا وقراراتنا الاستثمارية.
                </p>
              </motion.div>
              
              <motion.div
                className="glass-effect p-6 rounded-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="text-primary text-4xl mb-4">
                  <FaChartLine />
                </div>
                <h3 className="text-xl font-bold mb-3">الابتكار المستمر</h3>
                <p className="text-foreground-muted">
                  نسعى دائمًا لتطوير تقنياتنا وخوارزمياتنا لتحقيق أفضل النتائج لعملائنا. الابتكار هو جزء أساسي من هويتنا.
                </p>
              </motion.div>
              
              <motion.div
                className="glass-effect p-6 rounded-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="text-primary text-4xl mb-4">
                  <FaUsers />
                </div>
                <h3 className="text-xl font-bold mb-3">التركيز على العميل</h3>
                <p className="text-foreground-muted">
                  عملاؤنا هم محور اهتمامنا. نصمم منتجاتنا وخدماتنا لتلبية احتياجاتهم وتجاوز توقعاتهم.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* قسم الإنجازات */}
        <section className="py-16 bg-background-light">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {achievements.map((achievement, index) => (
                <motion.div 
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{achievement.value}</div>
                  <div className="text-foreground-muted">{achievement.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* قسم فريق العمل */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <motion.h2 
                className="text-3xl font-bold mb-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                فريق العمل
              </motion.h2>
              <motion.p 
                className="text-xl text-foreground-muted max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                نحن فريق من الخبراء المتخصصين في مجالات التكنولوجيا المالية والذكاء الاصطناعي والاستثمار
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  className="glass-effect rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                >
                  <div className="relative h-64 w-full">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary mb-3">{member.role}</p>
                    <p className="text-foreground-muted text-sm">{member.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* قسم الشركاء */}
        <section className="py-16 bg-background-light">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <motion.h2 
                className="text-3xl font-bold mb-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                شركاؤنا
              </motion.h2>
              <motion.p 
                className="text-xl text-foreground-muted max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                نتعاون مع أفضل الشركات العالمية لتقديم أفضل الخدمات لعملائنا
              </motion.p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {partners.map((partner, index) => (
                <motion.div
                  key={index}
                  className="glass-effect p-6 rounded-xl flex items-center justify-center h-24"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{partner.name}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* قسم الدعوة للعمل */}
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                انضم إلينا اليوم
              </motion.h2>
              
              <motion.p 
                className="text-xl mb-10 text-foreground-muted"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                ابدأ رحلتك الاستثمارية مع Iseix واستفد من تقنيات الذكاء الاصطناعي المتطورة لتحقيق أهدافك المالية.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <AnimatedButton href="/register" variant="primary" size="lg">
                  إنشاء حساب مجاني
                </AnimatedButton>
              </motion.div>
            </div>
          </div>
          
          {/* خلفية متدرجة */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10"></div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
