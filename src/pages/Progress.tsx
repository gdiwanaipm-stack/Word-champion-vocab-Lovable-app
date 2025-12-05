import { Navigation } from '@/components/Navigation';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import goldTrophy from '@/assets/gold-trophy.png';
import silverTrophy from '@/assets/silver-trophy.png';

export default function Progress() {
  const { dailyProgress, getCurrentWeekProgress, loading } = useVocabulary();
  const currentWeek = getCurrentWeekProgress();

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayProgress = dailyProgress.find(d => d.date === dateStr);
    
    return {
      date: format(date, 'EEE'),
      words: dayProgress?.wordsCompleted || 0,
      fullDate: dateStr,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Your Progress</h1>
            <p className="text-muted-foreground">Track your vocabulary learning journey</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {currentWeek.reward !== 'none' && (
                  <img 
                    src={currentWeek.reward === 'gold' ? goldTrophy : silverTrophy}
                    alt={`${currentWeek.reward} trophy`}
                    className="w-12 h-12 object-contain"
                  />
                )}
                {currentWeek.reward === 'none' && (
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <CardTitle>This Week's Progress</CardTitle>
                  <CardDescription>
                    {format(startOfWeek(new Date()), 'MMM d')} - {format(endOfWeek(new Date()), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{currentWeek.daysCompleted}</div>
                  <div className="text-sm text-muted-foreground">Days Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{currentWeek.totalWords}</div>
                  <div className="text-sm text-muted-foreground">Words Practiced</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {currentWeek.reward === 'gold' ? '🏆' : currentWeek.reward === 'silver' ? '🥈' : '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentWeek.reward === 'none' ? 'No Reward Yet' : 
                     currentWeek.reward === 'silver' ? 'Silver Cup' : 'Gold Cup'}
                  </div>
                </div>
              </div>
              
              {currentWeek.daysCompleted < 5 && (
                <div className="mt-4 p-3 bg-accent rounded-lg text-center text-sm">
                  Practice {5 - currentWeek.daysCompleted} more day{5 - currentWeek.daysCompleted !== 1 ? 's' : ''} to earn a Silver Cup! 🥈
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last 7 Days Activity</CardTitle>
              <CardDescription>Your daily word practice</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="words" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                    name="Words Practiced"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Rewards System</CardTitle>
              <CardDescription>How to earn cups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <img src={silverTrophy} alt="Silver Trophy" className="w-12 h-12 object-contain" />
                <div>
                  <div className="font-semibold">Silver Cup</div>
                  <div className="text-sm text-muted-foreground">Practice 5 out of 7 days in a week</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <img src={goldTrophy} alt="Gold Trophy" className="w-12 h-12 object-contain" />
                <div>
                  <div className="font-semibold">Gold Cup</div>
                  <div className="text-sm text-muted-foreground">Practice all 7 days in a week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
