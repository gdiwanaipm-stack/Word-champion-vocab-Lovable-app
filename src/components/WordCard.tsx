import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VocabularyWord } from '@/types/vocabulary';
import { CheckCircle, XCircle } from 'lucide-react';

interface WordCardProps {
  word: VocabularyWord;
  onComplete: (isCorrect: boolean) => void;
}

export function WordCard({ word, onComplete }: WordCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = () => {
    const correct = userAnswer.toLowerCase().trim().includes(word.meaning.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase());
    setIsCorrect(correct);
    setShowAnswer(true);
  };

  const handleSkip = () => {
    setIsCorrect(false);
    setShowAnswer(true);
  };

  const handleNext = () => {
    onComplete(isCorrect ?? false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-bold text-primary mb-2">{word.word}</CardTitle>
        <CardDescription className="text-lg">
          What does this word mean?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showAnswer ? (
          <div className="space-y-4">
            <Input
              placeholder="Type the meaning here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && userAnswer.trim() && handleSubmit()}
              className="text-lg"
              autoFocus
            />
            <div className="flex gap-3">
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={!userAnswer.trim()}
                size="lg"
              >
                Check Answer
              </Button>
              <Button 
                onClick={handleSkip} 
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Show Answer
              </Button>
            </div>
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
