// File: frontend/src/components/visualizations/ChartVisualizations.tsx
import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LabelList
} from 'recharts';
import {
  VisualizationConfig,
  QueryResultRow
} from '../../utils/queryResultRow';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#6366f1', '#ec4899', '#14b8a6', '#f97316'
];

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  description?: string;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  children, 
  description,
  className = ''
}) => (
  <div className={`mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
    <div className="mb-4">
      <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
    {children}
  </div>
);

export const BarChartVisualization: React.FC<{ config: VisualizationConfig }> = ({ config }) => {
  const { data, xAxis, yAxis, title } = config;

  if (!xAxis || !yAxis) return null;

  // Format data for Recharts
  const chartData = data.map(row => ({
    name: String(row[xAxis]),
    value: Number(row[yAxis]),
    [yAxis]: Number(row[yAxis])
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer
      title={title}
      description={`Total ${yAxis}: ${total.toLocaleString()}`}
      className="min-h-[400px]"
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
          layout="vertical" // Horizontal bars often show labels better
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value) => [
              Number(value).toLocaleString(),
              yAxis
            ]}
            labelFormatter={(label) => `Category: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="value"
            name={yAxis}
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value: unknown) => typeof value === 'number' ? value.toLocaleString() : String(value)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const PieChartVisualization: React.FC<{ config: VisualizationConfig }> = ({ config }) => {
  const { data, xAxis, yAxis, title } = config;

  if (!xAxis || !yAxis) return null;

  // Format data for Recharts
  const chartData = data.map(row => ({
    name: String(row[xAxis]),
    value: Number(row[yAxis])
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return null;

  return (
    <ChartContainer
      title={title}
      description={`Total ${yAxis}: ${total.toLocaleString()}`}
      className="min-h-[400px]"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => 
                  `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  yAxis
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2">
          <div className="space-y-3">
            {chartData.map((entry, index) => {
              const percentage = (entry.value / total) * 100;
              return (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 truncate">
                        {entry.name}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {entry.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ChartContainer>
  );
};

export const TableVisualization: React.FC<{ config: VisualizationConfig }> = ({ config }) => {
  const { data, title } = config;
  
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  return (
    <ChartContainer title={title || "Data Table"}>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row: QueryResultRow, rowIndex: number) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"}
                  >
                    {columns.map((col) => (
                      <td
                        key={`${rowIndex}-${col}`}
                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis"
                      >
                        {typeof row[col] === "object"
                          ? JSON.stringify(row[col])
                          : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-500 px-4 py-2 text-right bg-gray-50">
              Showing {data.length} row{data.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
};