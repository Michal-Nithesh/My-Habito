import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Award } from 'lucide-react';

interface TrendData {
  period: string;
  consistency_score: number;
  improvement_rate: number;
  average_completion_rate: number;
  best_day_of_week?: string;
  worst_day_of_week?: string;
}

interface TrendAnalysisCardProps {
  trendData: TrendData;
}

export function TrendAnalysisCard({ trendData }: TrendAnalysisCardProps) {
  const isImproving = trendData.improvement_rate > 0;
  const consistencyLevel =
    trendData.consistency_score >= 80
      ? 'Excellent'
      : trendData.consistency_score >= 60
      ? 'Good'
      : trendData.consistency_score >= 40
      ? 'Fair'
      : 'Needs Improvement';

  const consistencyColor =
    trendData.consistency_score >= 80
      ? 'text-green-600'
      : trendData.consistency_score >= 60
      ? 'text-blue-600'
      : trendData.consistency_score >= 40
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          Trend Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consistency Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Habit Consistency</span>
            <span className={`text-sm font-semibold ${consistencyColor}`}>
              {consistencyLevel}
            </span>
          </div>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${trendData.consistency_score}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="font-medium">{trendData.consistency_score.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Progress Score & Improvement */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isImproving ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span>Improvement</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                isImproving ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isImproving ? '+' : ''}
              {trendData.improvement_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs. last month</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Progress Score</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {trendData.average_completion_rate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">this month</p>
          </div>
        </div>

        {/* Best/Worst Days */}
        {trendData.best_day_of_week && trendData.worst_day_of_week && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Best day:</span>
              <span className="font-medium text-green-600">{trendData.best_day_of_week}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Needs work:</span>
              <span className="font-medium text-amber-600">{trendData.worst_day_of_week}</span>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-2">💡 Insights</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {trendData.consistency_score >= 80 && (
              <li>✓ You're very consistent with this habit!</li>
            )}
            {isImproving && (
              <li>✓ Great job! You're improving compared to last month.</li>
            )}
            {!isImproving && trendData.improvement_rate < -10 && (
              <li>⚠ Your completion rate has dropped. Try to get back on track!</li>
            )}
            {trendData.average_completion_rate < 50 && (
              <li>💪 Keep pushing! Small steps lead to big changes.</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
