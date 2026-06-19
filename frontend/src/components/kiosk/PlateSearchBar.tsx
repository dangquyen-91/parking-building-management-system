import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PlateSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocusTrigger?: number;
}

export function PlateSearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  isLoading = false,
  disabled = false,
  placeholder = 'Nhập biển số xe… (VD: 51A-12345)',
  autoFocusTrigger = 0,
}: PlateSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [autoFocusTrigger]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onSearch();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.toUpperCase());
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="h-6 w-6 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
          ) : (
            <Search className="h-6 w-6 text-slate-500" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder={placeholder}
          aria-label="Biển số xe"
          className={cn(
            'h-16 w-full rounded-2xl border bg-white/[0.04] pl-16 pr-16',
            'text-2xl font-bold tracking-widest text-white placeholder:text-slate-600',
            'outline-none transition-all duration-200',
            'border-white/10 hover:border-white/20',
            'focus:border-blue-400/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        />

        {value && !isLoading && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-5 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {!value && (
          <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
            <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] font-mono text-slate-600">
              Enter
            </kbd>
            <span className="text-xs text-slate-700">to search</span>
          </div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onSearch}
        disabled={!value.trim() || isLoading || disabled}
        className={cn(
          'mt-3 h-12 w-full rounded-xl font-semibold text-sm transition-all',
          'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
          'hover:from-blue-500 hover:to-indigo-500',
          'shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.4)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'flex items-center justify-center gap-2',
        )}
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>Đang tìm kiếm…</span>
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            <span>Tra cứu biển số</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
