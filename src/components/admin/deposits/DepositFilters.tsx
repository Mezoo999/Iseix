'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaCalendarAlt } from 'react-icons/fa';

interface DepositFiltersProps {
  onSearch: (term: string) => void;
  onFilterChange: (filter: 'all' | 'pending' | 'approved' | 'rejected') => void;
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  currentFilter: 'all' | 'pending' | 'approved' | 'rejected';
  onRefresh: () => void;
  isLoading: boolean;
}

export default function DepositFilters({
  onSearch,
  onFilterChange,
  onDateRangeChange,
  currentFilter,
  onRefresh,
  isLoading
}: DepositFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleDateFilter = () => {
    if (onDateRangeChange && startDate && endDate) {
      onDateRangeChange(new Date(startDate), new Date(endDate));
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <form onSubmit={handleSearch} className="w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full md:w-80 p-3 pr-10"
              placeholder="البحث عن معرف المستخدم أو رقم المعاملة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute inset-y-0 left-0 flex items-center pl-3"
            >
              <FaSearch className="text-foreground-muted" />
            </button>
          </div>
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            className={`px-4 py-2 rounded-lg ${currentFilter === 'all' ? 'bg-primary text-white' : 'bg-background-lighter hover:bg-background-light/80'}`}
            onClick={() => onFilterChange('all')}
          >
            الكل
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${currentFilter === 'pending' ? 'bg-primary text-white' : 'bg-background-lighter hover:bg-background-light/80'}`}
            onClick={() => onFilterChange('pending')}
          >
            قيد المراجعة
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${currentFilter === 'approved' ? 'bg-primary text-white' : 'bg-background-lighter hover:bg-background-light/80'}`}
            onClick={() => onFilterChange('approved')}
          >
            تمت الموافقة
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${currentFilter === 'rejected' ? 'bg-primary text-white' : 'bg-background-lighter hover:bg-background-light/80'}`}
            onClick={() => onFilterChange('rejected')}
          >
            مرفوض
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {onDateRangeChange && (
            <button
              className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light/80 flex items-center"
              onClick={() => setShowDateFilter(!showDateFilter)}
            >
              <FaCalendarAlt className="ml-2" />
              تصفية بالتاريخ
            </button>
          )}

          <button
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                تحديث
              </span>
            ) : (
              'تحديث'
            )}
          </button>
        </div>
      </div>

      {showDateFilter && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-background-lighter p-4 rounded-lg mb-4"
        >
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div>
              <label className="block mb-2 text-sm">من تاريخ</label>
              <input
                type="date"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg p-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">إلى تاريخ</label>
              <input
                type="date"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg p-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              onClick={handleDateFilter}
              disabled={!startDate || !endDate}
            >
              تطبيق
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
