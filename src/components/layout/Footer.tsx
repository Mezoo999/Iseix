'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaTwitter, FaTelegram, FaDiscord, FaYoutube, FaEnvelope, FaPhone } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // قائمة الروابط السريعة
  const quickLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'عن المنصة', href: '/about' },
    { name: 'الخطط الاستثمارية', href: '/plans' },
    { name: 'كيفية البدء', href: '/getting-started' },
    { name: 'الأسئلة الشائعة', href: '/faq' },
  ];

  // قائمة روابط القانونية
  const legalLinks = [
    { name: 'الشروط والأحكام', href: '/terms' },
    { name: 'سياسة الخصوصية', href: '/privacy' },
    { name: 'سياسة الاسترداد', href: '/refund' },
  ];

  // قائمة وسائل التواصل الاجتماعي
  const socialLinks = [
    { name: 'تويتر', icon: <FaTwitter />, href: 'https://twitter.com/iseix' },
    { name: 'تيليجرام', icon: <FaTelegram />, href: 'https://t.me/iseix' },
    { name: 'ديسكورد', icon: <FaDiscord />, href: 'https://discord.gg/iseix' },
    { name: 'يوتيوب', icon: <FaYoutube />, href: 'https://youtube.com/iseix' },
  ];

  return (
    <footer className="bg-background-light pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* القسم الأول: معلومات عن المنصة */}
          <div>
            <motion.div
              className="text-3xl font-bold text-gradient mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Iseix
            </motion.div>
            <p className="text-foreground-muted mb-6">
              منصة Iseix هي منصة استثمارية مبتكرة تعتمد على تقنيات الذكاء الاصطناعي المتطورة لتحقيق أقصى عوائد ممكنة للمستثمرين.
            </p>
            <div className="flex space-x-4 space-x-reverse">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground-muted hover:text-primary transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={link.name}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* القسم الثاني: روابط سريعة */}
          <div>
            <h3 className="text-xl font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-foreground-muted hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* القسم الثالث: روابط قانونية */}
          <div>
            <h3 className="text-xl font-bold mb-4">معلومات قانونية</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-foreground-muted hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* القسم الرابع: معلومات الاتصال */}
          <div>
            <h3 className="text-xl font-bold mb-4">تواصل معنا</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <FaEnvelope className="ml-2 text-primary" />
                <a
                  href="mailto:info@iseix.com"
                  className="text-foreground-muted hover:text-primary transition-colors"
                >
                  info@iseix.com
                </a>
              </li>
              <li className="flex items-center">
                <FaPhone className="ml-2 text-primary" />
                <a
                  href="tel:+123456789"
                  className="text-foreground-muted hover:text-primary transition-colors"
                >
                  +123 456 789
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* حقوق النشر */}
        <div className="border-t border-background-lighter mt-12 pt-8 text-center text-foreground-subtle">
          <p>© {currentYear} Iseix. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
