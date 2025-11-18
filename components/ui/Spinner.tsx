import React from 'react';
import { Icon } from '../icons';

export const Spinner = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <Icon name="aiLogo" className={`animate-spin text-primary ${className}`} />
);