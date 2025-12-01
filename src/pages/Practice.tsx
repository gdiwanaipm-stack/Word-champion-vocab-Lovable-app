import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { WordCard } from '@/components/WordCard';
import { ProgressionDialog } from '@/components/ProgressionDialog';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Trophy, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import soccerPlayer from '@/assets/soccer-player.png';
import goldTrophy from '@/assets/gold-trophy.png';

export default function Practice() {
  const navigate = useNavigate();
  const { getTodaysWords, updateProgress, checkAndProgressDifficulty } = useVocabulary();
  const [words] = useState(() => getTodaysWords());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showProgressionDialog, setShowProgressionDialog] = useState(false);
  const [newDifficulty, setNewDifficulty] = useState<string>('');
  
  const ATTEMPTS_PER_WORD = 3;
  const totalAttempts = words.length * ATTEMPTS_PER_WORD;

  const handleComplete = (isCorrect: boolean) => {
    updateProgress(words[currentIndex].id, isCorrect);
    if (isCorrect) setScore(prev => prev + 1);

    // Check if we need to move to the next attempt or next word
    if (currentAttempt < ATTEMPTS_PER_WORD) {
      // Move to next attempt for the same word
      setCurrentAttempt(prev => prev + 1);
    } else if (currentIndex < words.length - 1) {
      // Move to next word, reset attempt counter
      setCurrentIndex(prev => prev + 1);
      setCurrentAttempt(1);
    } else {
      // All words and attempts completed
      setCompleted(true);
      // Check for difficulty progression after completing practice
      const progressedDifficulty = checkAndProgressDifficulty();
      if (progressedDifficulty) {
        setNewDifficulty(progressedDifficulty);
        setShowProgressionDialog(true);
      }
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navigation />
        <ProgressionDialog 
          isOpen={showProgressionDialog}
          onClose={() => setShowProgressionDialog(false)}
          newDifficulty={newDifficulty}
        />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                {score === words.length ? (
                  <img src={goldTrophy} alt="Gold Trophy" className="w-32 h-32 object-contain animate-bounce" />
                ) : (
                  <img src={soccerPlayer} alt="Soccer Player" className="w-32 h-32 object-contain" />
                )}
              </div>
              <CardTitle className="text-3xl">Practice Complete!</CardTitle>
              <CardDescription className="text-lg mt-2">
                You scored {score} out of {totalAttempts}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {score === totalAttempts 
                  ? "Perfect score! You're a vocabulary champion! ⚽" 
                  : "Great effort! Keep practicing to improve your score!"}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/dashboard')} variant="outline">
                  Back to Dashboard
                </Button>
                <Button onClick={() => navigate('/review')}>
                  Review Words
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Word {currentIndex + 1} of {words.length} - Attempt {currentAttempt} of {ATTEMPTS_PER_WORD}
            </span>
            <span className="text-sm font-medium text-primary">
              Score: {score}/{(currentIndex * ATTEMPTS_PER_WORD) + currentAttempt}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-accent rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(((currentIndex * ATTEMPTS_PER_WORD) + currentAttempt) / totalAttempts) * 100}%` }}
            />
          </div>

          <WordCard 
            word={words[currentIndex]} 
            onComplete={handleComplete}
            attemptNumber={currentAttempt}
            totalAttempts={ATTEMPTS_PER_WORD}
          />
        </div>
      </main>
    </div>
  );
}
