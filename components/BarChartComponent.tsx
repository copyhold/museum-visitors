
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../types';
import { AGE_GROUP_LABELS, AGE_GROUP_COLORS } from '../constants';

interface BarChartComponentProps {
  data: ChartDataPoint[];
  xAxisKey: string;
  stackKeys: string[]; // e.g. ['children', 'adults', 'seniors', 'students']
  title: string;
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({ data, xAxisKey, stackKeys, title }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available for {title}.</div>;
  }
  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">{title}</h3>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{
              top: 20, right: 30, left: 0, bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value, name) => [value, AGE_GROUP_LABELS[name as string] || name]}
            />
            <Legend formatter={(value) => AGE_GROUP_LABELS[value] || value } />
            {stackKeys.map(key => (
              <Bar key={key} dataKey={key} stackId="a" fill={AGE_GROUP_COLORS[key]} name={AGE_GROUP_LABELS[key]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartComponent;
