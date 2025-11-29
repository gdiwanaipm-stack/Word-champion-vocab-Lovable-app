import { Navigation } from '@/components/Navigation';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

export default function Review() {
  const { getLearnedWords } = useVocabulary();
  const learnedWords = getLearnedWords();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Review Your Words</h1>
            <p className="text-muted-foreground">
              You've learned {learnedWords.length} words so far!
            </p>
          </div>

          {learnedWords.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No words learned yet. Start practicing to build your vocabulary!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {learnedWords.map((item: any) => {
                const word = item;
                const progress = item.progress;
                const accuracy = progress.attempts > 0 
                  ? Math.round((progress.correct / progress.attempts) * 100) 
                  : 0;

                return (
                  <Card key={word.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl text-primary">{word.word}</CardTitle>
                          <CardDescription className="mt-2">{word.meaning}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={word.difficulty === 'easy' ? 'secondary' : word.difficulty === 'medium' ? 'default' : 'destructive'}>
                            {word.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            {word.gradeLevel}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {word.nounExample && (
                        <div>
                          <span className="font-semibold text-sm">Noun: </span>
                          <span className="text-muted-foreground italic">{word.nounExample}</span>
                        </div>
                      )}
                      {word.verbExample && (
                        <div>
                          <span className="font-semibold text-sm">Verb: </span>
                          <span className="text-muted-foreground italic">{word.verbExample}</span>
                        </div>
                      )}
                      {word.adjectiveExample && (
                        <div>
                          <span className="font-semibold text-sm">Adjective: </span>
                          <span className="text-muted-foreground italic">{word.adjectiveExample}</span>
                        </div>
                      )}
                      <div className="flex gap-4 pt-2 text-sm border-t border-border">
                        <span>Practiced: <strong>{progress.attempts}</strong> times</span>
                        <span>Accuracy: <strong className={accuracy >= 70 ? 'text-primary' : 'text-destructive'}>{accuracy}%</strong></span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
