'use client';

import { motion } from 'framer-motion';
import { FaInfoCircle, FaMoneyBillWave, FaHandHoldingUsd } from 'react-icons/fa';
import { HoverElement } from '@/components/ui/AnimatedElements';

export default function DepositWithdrawInfo() {
  return (
    <motion.div
      className="bg-blue-900/30 rounded-xl mb-6 shadow-sm border border-blue-500/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 border-b border-blue-500/20 bg-blue-600">
        <h3 className="font-bold text-white flex items-center">
          <FaInfoCircle className="ml-2 text-white" />
          معلومات المعاملات
        </h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-blue-500/20 rounded-lg overflow-hidden">
            <div className="bg-blue-600 p-3 border-b border-blue-500/20">
              <div className="flex items-center">
                <FaMoneyBillWave className="text-white ml-2" />
                <span className="font-medium text-white">الإيداع</span>
              </div>
            </div>
            <div className="p-3 bg-blue-900/30">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-foreground-muted">الحد الأدنى:</td>
                    <td className="py-1 font-bold text-blue-400 text-left">10 USDT</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-foreground-muted">الشبكة:</td>
                    <td className="py-1 font-medium text-foreground text-left">TRC20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-blue-500/20 rounded-lg overflow-hidden">
            <div className="bg-blue-600 p-3 border-b border-blue-500/20">
              <div className="flex items-center">
                <FaHandHoldingUsd className="text-white ml-2" />
                <span className="font-medium text-white">السحب</span>
              </div>
            </div>
            <div className="p-3 bg-blue-900/30">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-foreground-muted">الحد الأدنى:</td>
                    <td className="py-1 font-bold text-blue-400 text-left">20 USDT</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-foreground-muted">الرسوم:</td>
                    <td className="py-1 font-medium text-foreground text-left">2 USDT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
