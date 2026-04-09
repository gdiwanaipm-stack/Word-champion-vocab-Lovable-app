import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VocabularyWord } from '@/types/vocabulary';
import { CheckCircle, Flag, Lightbulb, Loader2 } from 'lucide-react';
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

type EvaluationResult = 'correct' | 'almost' | 'incorrect';

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
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const { toast } = useToast();

  const MIN_ANSWER_LENGTH = 1;

  const MOTIVATIONAL_MESSAGES = [
    "🧠 Thinking hard...",
    "📚 Checking your answer...",
    "⭐ Almost there...",
    "🔍 Analyzing your response...",
    "💪 You're doing great!",
    "🌟 Let's see how you did...",
  ];

  const [motivationalIndex, setMotivationalIndex] = useState(0);

  useEffect(() => {
    if (!isEvaluating) return;
    setMotivationalIndex(0);
    const interval = setInterval(() => {
      setMotivationalIndex(prev => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isEvaluating]);

  // Reset form when word or attempt changes
  useEffect(() => {
    setUserAnswer('');
    setShowAnswer(false);
    setEvaluationResult(null);
    setFeedback('');
    setError('');
    setHint(null);
  }, [word.id, attemptNumber]);

  const handleSubmit = async () => {
    const trimmedAnswer = userAnswer.trim();
    
    // Validate answer length
    if (trimmedAnswer.length < MIN_ANSWER_LENGTH) {
      setError('Please type an answer');
      return;
    }
    
    setError('');
    setIsEvaluating(true);

    try {
      const { data, error: evalError } = await supabase.functions.invoke('evaluate-answer', {
        body: { 
          word: word.word, 
          meaning: word.meaning,
          studentAnswer: trimmedAnswer
        }
      });

      if (evalError) throw evalError;

      const result = data?.result || 'correct';
      const aiFeedback = data?.feedback_text || data?.feedback?.praise || "Great effort! You're doing wonderfully!";
      
      setEvaluationResult(result as EvaluationResult);
      setFeedback(aiFeedback);
      setShowAnswer(true);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      // Fallback to lenient grading on error
      setEvaluationResult('correct');
      setFeedback("Great effort! You're doing wonderfully!");
      setShowAnswer(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    // Both 'correct' and 'almost' count as correct for progression
    const isCorrect = evaluationResult === 'correct' || evaluationResult === 'almost';
    onComplete(isCorrect);
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

  const getResultStyles = () => {
    switch (evaluationResult) {
      case 'correct':
        return 'bg-primary/10 text-primary';
      case 'almost':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'incorrect':
        return 'bg-muted text-muted-foreground';
      default:
        return '';
    }
  };

  const getResultContent = () => {
    switch (evaluationResult) {
      case 'correct':
        return {
          icon: <CheckCircle className="w-8 h-8" />,
          title: "Amazing job! 🌟",
          subtitle: "You really understood that word!"
        };
      case 'almost':
        return {
          icon: <Lightbulb className="w-8 h-8" />,
          title: "So close! 💪",
          subtitle: "You're almost there! Let's learn a bit more."
        };
      case 'incorrect':
        return {
          icon: <Lightbulb className="w-8 h-8" />,
          title: "Great effort! 💪",
          subtitle: "Let's learn this word together!"
        };
      default:
        return { icon: null, title: '', subtitle: '' };
    }
  };

  const resultContent = getResultContent();

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
                onKeyDown={(e) => e.key === 'Enter' && isValidAnswer && !isEvaluating && handleSubmit()}
                className="text-lg"
                autoFocus
                disabled={isEvaluating}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleGetHint}
                variant="outline"
                disabled={isLoadingHint || hint !== null || isEvaluating}
                className="flex-1"
                size="lg"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {isLoadingHint ? "Getting hint..." : hint ? "Hint shown" : "Get Hint"}
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={!isValidAnswer || isEvaluating}
                size="lg"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Answer'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={cn(
              'flex flex-col items-center justify-center gap-2 p-4 rounded-lg',
              getResultStyles()
            )}>
              {resultContent.icon}
              <span className="text-lg font-semibold">{resultContent.title}</span>
              <span className="text-sm text-center">{resultContent.subtitle}</span>
            </div>

            {/* AI Feedback */}
            {feedback && (
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                <p className="text-sm text-foreground text-center">{feedback}</p>
              </div>
            )}

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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
