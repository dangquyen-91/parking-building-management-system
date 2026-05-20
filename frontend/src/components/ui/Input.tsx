import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  touched?: boolean;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, touched, icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const hasError = touched && !!error;

    return (
      <div className="w-full flex flex-col gap-1.5 relative">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
          {label}
        </label>
        
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full px-4 py-3 rounded-xl bg-slate-950/50 border text-white text-sm transition-all outline-none duration-250",
              "border-white/[0.08] hover:border-white/20 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10",
              icon ? "pl-11" : "pl-4",
              isPassword ? "pr-11" : "pr-4",
              hasError && "border-red-500/80 hover:border-red-500/80 focus:border-red-500/80 focus:ring-red-500/10",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

          {hasError && !isPassword && (
            <div className="absolute right-3.5 pointer-events-none text-red-400 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          )}
        </div>

        {hasError && (
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-red-400 font-medium animate-fade-in">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
