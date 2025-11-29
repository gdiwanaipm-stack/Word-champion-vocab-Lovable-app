import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Trophy, Target, Book, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const { dailyProgress, getCurrentWeekProgress, getLearnedWords } = useVocabulary();
  const weekProgress = getCurrentWeekProgress();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayProgress = dailyProgress.find(d => d.date === today);
  const learnedWords = getLearnedWords();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">VocabChamp ⚽</h1>
          <p className="text-muted-foreground">Score goals with words!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayProgress?.wordsCompleted || 0}/3</div>
              <p className="text-xs text-muted-foreground">words practiced</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekProgress.daysCompleted}/7</div>
              <p className="text-xs text-muted-foreground">days completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Book className="w-4 h-4 text-primary" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learnedWords.length}</div>
              <p className="text-xs text-muted-foreground">words learned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekProgress.daysCompleted}</div>
              <p className="text-xs text-muted-foreground">day streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Reward */}
        {weekProgress.reward !== 'none' && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className={`w-6 h-6 ${weekProgress.reward === 'gold' ? 'text-yellow-500' : 'text-gray-400'}`} />
                Week {weekProgress.reward === 'gold' ? 'Gold' : 'Silver'} Cup!
              </CardTitle>
              <CardDescription>
                {weekProgress.reward === 'gold' 
                  ? 'Amazing! You practiced all 7 days this week!' 
                  : 'Great job! You practiced 5+ days this week!'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Today's Practice */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Practice</CardTitle>
            <CardDescription>
              Learn 3 new words today and master them over 3 weeks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/practice')} 
              size="lg" 
              className="w-full"
            >
              {todayProgress?.wordsCompleted === 3 ? 'Practice Again' : 'Start Learning'}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/review')}>
            <CardHeader>
              <CardTitle className="text-lg">Review Words</CardTitle>
              <CardDescription>Review all your learned words</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{learnedWords.length} words</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/progress')}>
            <CardHeader>
              <CardTitle className="text-lg">View Progress</CardTitle>
              <CardDescription>See your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{weekProgress.totalWords} this week</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
