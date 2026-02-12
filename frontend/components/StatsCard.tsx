import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: React.ReactNode;
  color?: 'ocean' | 'green' | 'purple' | 'orange';
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  label, 
  value, 
  trend, 
  trendLabel, 
  icon 
}) => {
  const isPositive = trend >= 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 hover:border-ocean-200 transition-colors group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className="p-2 bg-ocean-50 rounded-lg text-ocean-600 group-hover:bg-ocean-100 transition-colors">
          {icon}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
          isPositive 
            ? 'text-green-700 bg-green-50' 
            : 'text-red-700 bg-red-50'
        }`}>
          {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          {isPositive ? '+' : ''}{trend}%
        </span>
        <span className="text-xs text-gray-400">{trendLabel}</span>
      </div>
    </div>
  );
};
