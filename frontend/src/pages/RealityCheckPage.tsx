import { useQuery } from '@tanstack/react-query';
import { fetchRealitySummary } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { RealitySummary } from '../lib/types';

export default function RealityCheckPage() {
  const { data, isLoading } = useQuery<RealitySummary>({ queryKey: ['reality', 'summary'], queryFn: fetchRealitySummary });

  return (
    <div className="page-stack">
      <Card title="Reality check" className="wide-card">
        <p className="body-text">This page tracks how planning matched execution with simple metrics.</p>
      </Card>

      <Card>
        {isLoading ? (
          <Skeleton height="160px" />
        ) : (
          <div className="reality-grid reality-panel">
            <div>
              <span className="reality-label">Planned</span>
              <strong>{data?.plannedTasks}</strong>
            </div>
            <div>
              <span className="reality-label">Completed</span>
              <strong>{data?.completedTasks}</strong>
            </div>
            <div>
              <span className="reality-label">Completion</span>
              <strong>{data?.completionPercentage}%</strong>
            </div>
            {data?.overPlanningIndicator && (
              <div className="over-planning-warning">
                <span>Note: You planned many tasks today. Consider prioritizing.</span>
              </div>
            )}
            {data?.insights && data.insights.length > 0 && (
              <div className="insights-section">
                <h4>Insights</h4>
                <ul>
                  {data.insights.map((insight, i) => <li key={i}>{insight}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
