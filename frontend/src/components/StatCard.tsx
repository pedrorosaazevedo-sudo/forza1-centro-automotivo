import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'gold' | 'green' | 'red';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon, variant = 'default' }) => {
  let valClass = '';
  if (variant === 'gold') valClass = 'stat-gold';
  if (variant === 'green') valClass = 'stat-green';
  if (variant === 'red') valClass = 'stat-red';

  return (
    <div className="stat-card">
      <div className="stat-title">
        <span>{title}</span>
        {icon && <span>{icon}</span>}
      </div>
      <div className={`stat-value ${valClass}`}>
        {value}
      </div>
      {subtext && <div className="stat-sub">{subtext}</div>}
    </div>
  );
};
