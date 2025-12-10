import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { WordCard } from '@/components/WordCard';
import { ProgressionDialog } from '@/components/ProgressionDialog';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import soccerPlayer from '@/assets/soccer-player.png';
import goldTrophy from '@/assets/gold-trophy.png';

export default function Practice() {
  const navigate = useNavigate();
  const { getTodaysWords, updateProgress, checkAndProgressDifficulty, toggleDifficultWord, isWordDifficult, loading } = useVocabulary();
  
  // Track all word IDs practiced in this session to exclude them from future rounds
  const [practicedWordIds, setPracticedWordIds] = useState<string[]>([]);
  const [words, setWords] = useState(() => getTodaysWords());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showProgressionDialog, setShowProgressionDialog] = useState(false);
  const [newDifficulty, setNewDifficulty] = useState<string>('');
  
  const ATTEMPTS_PER_WORD = 2;
  const totalAttempts = words.length * ATTEMPTS_PER_WORD;

  const handleComplete = async (isCorrect: boolean) => {
    const currentWordId = words[currentIndex].id;
    await updateProgress(currentWordId, isCorrect);
    if (isCorrect) setScore(prev => prev + 1);

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (currentAttempt < ATTEMPTS_PER_WORD) {
      setCurrentIndex(0);
      setCurrentAttempt(prev => prev + 1);
    } else {
      // Session complete - add current words to practiced list
      setPracticedWordIds(prev => [...prev, ...words.map(w => w.id)]);
      setCompleted(true);
      const progressedDifficulty = await checkAndProgressDifficulty();
      if (progressedDifficulty) {
        setNewDifficulty(progressedDifficulty);
        setShowProgressionDialog(true);
      }
    }
  };

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

  const handlePracticeMore = () => {
    // Fetch fresh words, excluding all words practiced in this session
    const freshWords = getTodaysWords(practicedWordIds);
    setWords(freshWords);
    setCurrentIndex(0);
    setCurrentAttempt(1);
    setCompleted(false);
    setScore(0);
    setShowProgressionDialog(false);
    setNewDifficulty('');
  };

  if (words.length === 0 || !words[currentIndex]) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <img src={goldTrophy} alt="Gold Trophy" className="w-32 h-32 object-contain" />
              </div>
              <CardTitle className="text-3xl">All Done for Today!</CardTitle>
              <CardDescription className="text-lg mt-2">
                You've practiced all available words at this level.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Come back tomorrow for more practice or try a different difficulty level!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/settings')} size="lg">
                  Change Difficulty
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="outline">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handlePracticeMore} size="lg">
                  Practice More Words
                </Button>
                <Button onClick={() => navigate('/review')} variant="outline">
                  Review Words
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="ghost">
                  Back to Dashboard
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Round {currentAttempt} of {ATTEMPTS_PER_WORD} - Word {currentIndex + 1} of {words.length}
            </span>
            <span className="text-sm font-medium text-primary">
              Score: {score}/{((currentAttempt - 1) * words.length) + currentIndex + 1}
            </span>
          </div>

          <div className="w-full bg-accent rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((((currentAttempt - 1) * words.length) + currentIndex + 1) / totalAttempts) * 100}%` }}
            />
          </div>

          <WordCard 
            word={words[currentIndex]} 
            onComplete={handleComplete}
            attemptNumber={currentAttempt}
            totalAttempts={ATTEMPTS_PER_WORD}
            onMarkDifficult={toggleDifficultWord}
            isDifficult={isWordDifficult(words[currentIndex].id)}
          />
        </div>
      </main>
    </div>
  );
}
