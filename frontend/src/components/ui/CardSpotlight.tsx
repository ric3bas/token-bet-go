'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const CardSpotlight = ({ children, className, spotlightColor: _spotlightColor, ...props }: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('app-card relative p-5 sm:p-6', className)} {...props}>
    <div className="relative z-10">{children}</div>
  </div>
);
