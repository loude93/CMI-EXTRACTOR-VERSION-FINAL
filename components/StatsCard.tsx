
import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
      <div className={`${color} p-3 rounded-xl text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">
          {typeof value === 'number' ? value.toLocaleString('fr-MA', { minimumFractionDigits: 2 }) : value}
          {typeof value === 'number' && label.includes('(DH)') ? ' DH' : ''}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;
