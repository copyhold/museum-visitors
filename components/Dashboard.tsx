
import React, { useState } from 'react';
import { DailySummary, ChartDataPoint, HistoricalReportParams } from '../types';
import BarChartComponent from './BarChartComponent';
import { AGE_GROUP_LABELS, HISTORICAL_PERIOD_OPTIONS, HISTORICAL_COUNT_OPTIONS } from '../constants';

interface DashboardProps {
  todaySummary: DailySummary;
  currentMonthData: ChartDataPoint[];
  historicalData: ChartDataPoint[];
  onFetchHistoricalData: (period: 'week' | 'month', count: number) => void;
  initialHistoricalParams: HistoricalReportParams;
  ageGroupKeys: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
    todaySummary, currentMonthData, historicalData, onFetchHistoricalData, initialHistoricalParams, ageGroupKeys 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>(initialHistoricalParams.period);
  const [selectedCount, setSelectedCount] = useState<number>(initialHistoricalParams.count);

  const handleHistoricalParamsChange = () => {
    onFetchHistoricalData(selectedPeriod, selectedCount);
  };
  
  return (
    <div className="space-y-8">
      {/* Today's Summary */}
      <section className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Today's Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Visitors" value={todaySummary.total_visitors} />
          <SummaryCard title="Individual Visits" value={todaySummary.individual_visits} />
          <SummaryCard title="Group Visits" value={todaySummary.group_visits} />
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-600 mb-2">Age Breakdown Today:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
             {Object.entries(todaySummary.age_breakdown).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-3 rounded-md text-center">
                    <p className="text-xs text-gray-500">{AGE_GROUP_LABELS[key]}</p>
                    <p className="text-xl font-semibold text-blue-600">{value}</p>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Month Graph */}
      <section>
        <BarChartComponent
          data={currentMonthData}
          xAxisKey="name"
          stackKeys={ageGroupKeys}
          title="Current Month - Daily Visitors by Age Group"
        />
      </section>

      {/* Historical Reports */}
      <section className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Historical Reports</h2>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6 items-end">
          <div>
            <label htmlFor="periodType" className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
            <select
              id="periodType"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month')}
              className="mt-1 block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white"
            >
              {HISTORICAL_PERIOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="periodCount" className="block text-sm font-medium text-gray-700 mb-1">Last N Periods</label>
            <select
              id="periodCount"
              value={selectedCount}
              onChange={(e) => setSelectedCount(Number(e.target.value))}
              className="mt-1 block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white"
            >
              {HISTORICAL_COUNT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleHistoricalParamsChange}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-150 h-fit"
          >
            Generate Report
          </button>
        </div>
        <BarChartComponent
          data={historicalData}
          xAxisKey="name"
          stackKeys={ageGroupKeys}
          title={`Visitor Trends - Last ${selectedCount} ${selectedPeriod === 'week' ? 'Weeks' : 'Months'}`}
        />
      </section>
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: number;
}
const SummaryCard: React.FC<SummaryCardProps> = ({ title, value }) => (
  <div className="bg-blue-50 p-4 rounded-lg shadow">
    <h4 className="text-sm font-medium text-blue-500">{title}</h4>
    <p className="text-3xl font-bold text-blue-700">{value}</p>
  </div>
);

export default Dashboard;
