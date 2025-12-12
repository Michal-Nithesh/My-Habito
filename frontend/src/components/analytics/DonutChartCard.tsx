import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CompletionData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartCardProps {
  completed: number;
  skipped: number;
  failed: number;
  partial: number;
}

export function DonutChartCard({ completed, skipped, failed, partial }: DonutChartCardProps) {
  const data: CompletionData[] = [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'Partial', value: partial, color: '#f59e0b' },
    { name: 'Skipped', value: skipped, color: '#6b7280' },
    { name: 'Failed', value: failed, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const total = completed + skipped + failed + partial;
  const completionPercentage = total > 0 ? ((completed + partial * 0.5) / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-indigo-500" />
          Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry: any) => {
                  const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
                  return `${value}: ${entry.value} (${percentage}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {completionPercentage.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground">Overall Success Rate</p>
        </div>

        {/* Breakdown */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}:</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
