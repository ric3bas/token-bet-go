'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const AceternityInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, placeholder, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    return <div className="relative">
      <input
        ref={ref}
        id={inputId}
        type={type}
        placeholder={label ? ' ' : placeholder}
        className={cn('app-input peer flex h-11 w-full px-3.5 pb-1 pt-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50', className)}
        {...props}
      />
      {label && (
        <label htmlFor={inputId} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-500 transition-all duration-150 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#64b5ff] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-neutral-400">
          {label}
        </label>
      )}
    </div>;
  }
);
AceternityInput.displayName = 'AceternityInput';
