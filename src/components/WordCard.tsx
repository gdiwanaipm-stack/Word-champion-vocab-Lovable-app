import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VocabularyWord } from '@/types/vocabulary';
import { CheckCircle, XCircle } from 'lucide-react';

interface WordCardProps {
  word: VocabularyWord;
  onComplete: (isCorrect: boolean) => void;
  attemptNumber: number;
  totalAttempts: number;
}

export function WordCard({ word, onComplete, attemptNumber, totalAttempts }: WordCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const MIN_ANSWER_LENGTH = 5;

  const handleSubmit = () => {
    const trimmedAnswer = userAnswer.trim();
    
    // Validate answer length
    if (trimmedAnswer.length < MIN_ANSWER_LENGTH) {
      setError(`Please write at least ${MIN_ANSWER_LENGTH} characters`);
      return;
    }
    
    setError('');
    const correct = trimmedAnswer.toLowerCase().includes(word.meaning.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase());
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
        <CardTitle className="text-4xl font-bold text-primary mb-2">{word.word}</CardTitle>
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
