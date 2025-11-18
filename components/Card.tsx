// Fix: Implemented the missing reusable Card component.
import React from 'react';

type CardProps = {
  title?: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ title, titleIcon, children, className = '' }) => {
  return (
    <div className={`bg-card text-card-foreground rounded-lg border border-border shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center p-4 border-b border-border">
          {titleIcon && <div className="mr-3 text-muted-foreground">{titleIcon}</div>}
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
