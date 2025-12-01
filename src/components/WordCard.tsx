import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VocabularyWord } from '@/types/vocabulary';
import { CheckCircle, XCircle, Flag } from 'lucide-react';

interface WordCardProps {
  word: VocabularyWord;
  onComplete: (isCorrect: boolean) => void;
  attemptNumber: number;
  totalAttempts: number;
  onMarkDifficult?: (wordId: string) => void;
  isDifficult?: boolean;
}

export function WordCard({ word, onComplete, attemptNumber, totalAttempts, onMarkDifficult, isDifficult = false }: WordCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const MIN_ANSWER_LENGTH = 5;

  // Reset form when word or attempt changes
  useEffect(() => {
    setUserAnswer('');
    setShowAnswer(false);
    setIsCorrect(null);
    setError('');
  }, [word.id, attemptNumber]);

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
      .filter(w => w.length > 2); // Include more words (>2 chars instead of >3)
    
    const answerLower = trimmedAnswer.toLowerCase();
    const answerWords = answerLower.split(/\W+/).filter(w => w.length > 2);
    
    // Check if key words from meaning appear in the answer (exact match)
    const exactMatches = meaningWords.filter(word => answerLower.includes(word));
    
    // Check if answer words are similar to meaning words (partial match)
    const partialMatches = meaningWords.filter(meaningWord => 
      answerWords.some(answerWord => 
        meaningWord.includes(answerWord) || answerWord.includes(meaningWord)
      )
    );
    
    // Combine exact and partial matches
    const totalMatches = new Set([...exactMatches, ...partialMatches]).size;
    const matchPercentage = totalMatches / Math.max(meaningWords.length, 1);
    
    // Consider it correct if at least 15% of key words match (very relaxed threshold for subjective meanings)
    const correct = matchPercentage >= 0.15;
    
    setIsCorrect(correct);
    setShowAnswer(true);
  };

  const handleNext = () => {
    onComplete(isCorrect ?? false);
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
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={!isValidAnswer}
              size="lg"
            >
              Check Answer
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={cn(
              'flex items-center justify-center gap-2 p-4 rounded-lg',
              isCorrect ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
            )}>
              {isCorrect ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-lg font-semibold">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6" />
                  <span className="text-lg font-semibold">Not quite right</span>
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
