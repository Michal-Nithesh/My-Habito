import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Calendar } from 'lucide-react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays } from 'date-fns';

interface HeatmapValue {
  date: string;
  count: number;
  level: number;
}

interface CompletionRateCardProps {
  completionPercentage: number;
  completedDays: number;
  totalDays: number;
  heatmapData: HeatmapValue[];
}

export function CompletionRateCard({
  completionPercentage,
  completedDays,
  totalDays,
  heatmapData,
}: CompletionRateCardProps) {
  const today = new Date();
  const startDate = subDays(today, 365);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Completion Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Percentage Circle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-4xl font-bold text-blue-600">
              {completionPercentage.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {completedDays} of {totalDays} days completed
            </p>
          </div>

          {/* Visual Circle */}
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionPercentage / 100)}`}
                className="text-blue-600"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            <span>Activity Over the Year</span>
          </div>
          <div className="habit-heatmap">
            <CalendarHeatmap
              startDate={startDate}
              endDate={today}
              values={heatmapData.map((d) => ({
                date: d.date,
                count: d.count,
              }))}
              classForValue={(value) => {
                if (!value) {
                  return 'color-empty';
                }
                const level = heatmapData.find((d) => d.date === value.date)?.level || 0;
                return `color-scale-${level}`;
              }}
              showWeekdayLabels={true}
            />
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm color-scale-${level}`}
                  style={{
                    backgroundColor:
                      level === 0
                        ? '#ebedf0'
                        : level === 1
                        ? '#c6e48b'
                        : level === 2
                        ? '#7bc96f'
                        : level === 3
                        ? '#239a3b'
                        : '#196127',
                  }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
