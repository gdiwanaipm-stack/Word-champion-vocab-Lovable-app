import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VocabularyWord } from '@/types/vocabulary';
import { CheckCircle, Flag, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WordCardProps {
  word: VocabularyWord;
  onComplete: (isCorrect: boolean) => void;
  attemptNumber: number;
  totalAttempts: number;
  onMarkDifficult?: (wordId: string) => void;
  isDifficult?: boolean;
}

export function WordCard({ 
  word, 
  onComplete, 
  attemptNumber, 
  totalAttempts, 
  onMarkDifficult, 
  isDifficult = false
}: WordCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const { toast } = useToast();

  const MIN_ANSWER_LENGTH = 5;

  // Reset form when word or attempt changes
  useEffect(() => {
    setUserAnswer('');
    setShowAnswer(false);
    setIsCorrect(null);
    setError('');
    setHint(null);
  }, [word.id, attemptNumber]);

  // Simple Levenshtein distance for typo tolerance
  const getEditDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Check if two words are similar (allowing typos)
  const areWordsSimilar = (word1: string, word2: string): boolean => {
    if (word1 === word2) return true;
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    // Allow more typos for longer words
    const maxDistance = word1.length <= 4 ? 1 : word1.length <= 7 ? 2 : 3;
    const distance = getEditDistance(word1, word2);
    return distance <= maxDistance;
  };

  const handleSubmit = () => {
    const trimmedAnswer = userAnswer.trim();
    
    // Validate answer length
    if (trimmedAnswer.length < MIN_ANSWER_LENGTH) {
      setError(`Please write at least ${MIN_ANSWER_LENGTH} characters`);
      return;
    }
    
    setError('');
    
    // Very lenient checking: extract key words from the meaning
    const meaningWords = word.meaning.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 2);
    
    const answerLower = trimmedAnswer.toLowerCase();
    const answerWords = answerLower.split(/\W+/).filter(w => w.length > 2);
    
    // Check for matches including typo tolerance
    const matchedMeaningWords = meaningWords.filter(meaningWord => 
      answerWords.some(answerWord => areWordsSimilar(meaningWord, answerWord))
    );
    
    const matchPercentage = matchedMeaningWords.length / Math.max(meaningWords.length, 1);
    
    // Consider it correct if at least 20% of key words match (allows subjectivity)
    const correct = matchPercentage >= 0.20;
    
    setIsCorrect(correct);
    setShowAnswer(true);
  };

  const handleNext = () => {
    onComplete(isCorrect ?? false);
  };

  const handleGetHint = async () => {
    setIsLoadingHint(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-hint', {
        body: { word: word.word, meaning: word.meaning }
      });

      if (error) throw error;

      if (data?.hint) {
        setHint(data.hint);
      } else {
        throw new Error('No hint generated');
      }
    } catch (error) {
      console.error('Error generating hint:', error);
      toast({
        title: "Couldn't generate hint",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHint(false);
    }
  };

  const isValidAnswer = userAnswer.trim().length >= MIN_ANSWER_LENGTH;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2">
          <CardTitle className="text-4xl font-bold text-primary mb-2">{word.word}</CardTitle>
          {onMarkDifficult && (
            <Button
              variant={isDifficult ? "default" : "ghost"}
              size="icon"
              onClick={() => onMarkDifficult(word.id)}
              className="mb-2"
              title={isDifficult ? "Marked as difficult" : "Mark as difficult"}
            >
              <Flag className={cn("w-5 h-5", isDifficult && "fill-current")} />
            </Button>
          )}
        </div>
        <CardDescription className="text-lg">
          What does this word mean? (Attempt {attemptNumber} of {totalAttempts})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showAnswer ? (
          <div className="space-y-4">
            {hint && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{hint}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Input
                placeholder="Type the meaning here..."
                value={userAnswer}
                onChange={(e) => {
                  setUserAnswer(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && isValidAnswer && handleSubmit()}
                className="text-lg"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {!error && userAnswer.trim().length > 0 && !isValidAnswer && (
                <p className="text-sm text-muted-foreground">
                  Write at least {MIN_ANSWER_LENGTH} characters
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleGetHint}
                variant="outline"
                disabled={isLoadingHint || hint !== null}
                className="flex-1"
                size="lg"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {isLoadingHint ? "Getting hint..." : hint ? "Hint shown" : "Get Hint"}
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={!isValidAnswer}
                size="lg"
              >
                Check Answer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={cn(
              'flex flex-col items-center justify-center gap-2 p-4 rounded-lg',
              isCorrect ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            )}>
              {isCorrect ? (
                <>
                  <CheckCircle className="w-8 h-8" />
                  <span className="text-lg font-semibold">Amazing job! 🌟</span>
                  <span className="text-sm text-center">You really understood that word!</span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-8 h-8" />
                  <span className="text-lg font-semibold">Great effort! 💪</span>
                  <span className="text-sm text-center">You're learning! Let's see the full meaning together.</span>
                </>
              )}
            </div>

            <div className="space-y-4 p-4 bg-accent rounded-lg">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Meaning:</h4>
                <p className="text-muted-foreground">{word.meaning}</p>
              </div>

              {word.nounExample && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">As a Noun:</h4>
                  <p className="text-muted-foreground italic">{word.nounExample}</p>
                </div>
              )}

              {word.verbExample && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">As a Verb:</h4>
                  <p className="text-muted-foreground italic">{word.verbExample}</p>
                </div>
              )}

              {word.adjectiveExample && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">As an Adjective:</h4>
                  <p className="text-muted-foreground italic">{word.adjectiveExample}</p>
                </div>
              )}
            </div>

            <Button onClick={handleNext} className="w-full" size="lg">
              Next Word
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
