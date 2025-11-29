import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Award } from 'lucide-react';
import { ProgressionStats } from '@/types/vocabulary';

interface ProgressionCardProps {
  stats: ProgressionStats;
  currentDifficulty: string;
}

export function ProgressionCard({ stats, currentDifficulty }: ProgressionCardProps) {
  const accuracyPercent = Math.round(stats.currentAccuracy * 100);
  const progressPercent = Math.min(
    (stats.wordsAtCurrentDifficulty / 15) * 100,
    100
  );
  const thresholdPercent = Math.round(stats.progressionThreshold * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle>Progression Tracker</CardTitle>
          </div>
          <Badge variant={stats.isReadyForProgression ? "default" : "secondary"} className="capitalize">
            {currentDifficulty.replace('-', ' ')}
          </Badge>
        </div>
        <CardDescription>
          {stats.isReadyForProgression
            ? `Ready to advance to ${stats.nextDifficulty?.replace('-', ' ')}!`
            : 'Keep practicing to unlock the next difficulty level'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Accuracy Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Accuracy</span>
            </div>
            <span className={accuracyPercent >= thresholdPercent ? "text-primary font-bold" : ""}>
              {accuracyPercent}% / {thresholdPercent}%
            </span>
          </div>
          <Progress 
            value={accuracyPercent} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {accuracyPercent >= thresholdPercent 
              ? '✓ Accuracy requirement met!' 
              : `Need ${thresholdPercent - accuracyPercent}% more accuracy`}
          </p>
        </div>

        {/* Words Completed Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Words Practiced</span>
            </div>
            <span className={stats.wordsAtCurrentDifficulty >= 15 ? "text-primary font-bold" : ""}>
              {stats.wordsAtCurrentDifficulty} / 15
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {stats.wordsAtCurrentDifficulty >= 15
              ? '✓ Word requirement met!'
              : `Practice ${15 - stats.wordsAtCurrentDifficulty} more words`}
          </p>
        </div>

        {stats.isReadyForProgression && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-primary">
              🎉 Excellent work! You'll automatically advance to {stats.nextDifficulty?.replace('-', ' ')} difficulty
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
