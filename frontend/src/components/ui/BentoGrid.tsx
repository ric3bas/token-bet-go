'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'grid md:auto-rows-[16rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'row-span-1 rounded-2xl group/bento hover:shadow-2xl transition duration-200 shadow-input p-4 border border-white/[0.08] bg-[#0c101c]/70 backdrop-blur-md justify-between flex flex-col space-y-3 hover:border-purple-500/40',
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-1 transition duration-200">
        <div className="mb-2">{icon}</div>
        <div className="font-bold text-white text-sm mb-1">{title}</div>
        <div className="font-normal text-slate-400 text-xs leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};

