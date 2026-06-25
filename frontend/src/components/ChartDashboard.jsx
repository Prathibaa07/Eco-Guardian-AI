import React from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';

const COLORS = [
  '#10B981', '#06B6D4', '#F59E0B', '#F97316', '#EF4444',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'
];

const SEVERITY_COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#F97316',
  Critical: '#EF4444'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-800 p-3 rounded-xl backdrop-blur-md shadow-xl text-xs">
        {label && <p className="font-semibold text-slate-350 mb-1">{label}</p>}
        {payload.map((item, index) => (
          <p key={index} className="flex items-center gap-2" style={{ color: item.color || item.payload.fill || '#10B981' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.payload.fill || '#10B981' }} />
            <span>{item.name}:</span>
            <strong className="text-slate-100">{item.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const CategoryPieChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-semibold">
        No reporting data available
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SeverityBarChart = ({ data = {} }) => {
  const chartData = [
    { name: 'Low', count: data.Low || 0, fill: SEVERITY_COLORS.Low },
    { name: 'Medium', count: data.Medium || 0, fill: SEVERITY_COLORS.Medium },
    { name: 'High', count: data.High || 0, fill: SEVERITY_COLORS.High },
    { name: 'Critical', count: data.Critical || 0, fill: SEVERITY_COLORS.Critical }
  ];

  const total = chartData.reduce((acc, curr) => acc + curr.count, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-semibold">
        No reporting data available
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Issues Count">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MonthlyAreaChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-semibold">
        No trend data available
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="reports"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorReports)"
            name="Issues Submitted"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
