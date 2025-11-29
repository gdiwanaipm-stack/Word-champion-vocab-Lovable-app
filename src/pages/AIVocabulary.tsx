import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Book, GraduationCap } from 'lucide-react';
import { useAIVocabulary } from '@/hooks/useAIVocabulary';
import { useVocabulary } from '@/hooks/useVocabulary';
import { VocabularyWord } from '@/types/vocabulary';

const AIVocabulary = () => {
  const { settings } = useVocabulary();
  const { generateVocabulary, isGenerating } = useAIVocabulary();
  const [generatedWords, setGeneratedWords] = useState<VocabularyWord[]>([]);

  const handleGenerate = async () => {
    const words = await generateVocabulary(settings.gradeLevel, settings.difficulty, 3);
    setGeneratedWords(words);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Vocabulary Generator</h1>
          </div>
          <p className="text-muted-foreground">
            Generate fresh vocabulary words tailored to your settings
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Current Settings</CardTitle>
            <CardDescription>Words will be generated based on these settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Grade Level:</span>
                <Badge variant="secondary" className="capitalize">
                  {settings.gradeLevel}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Book className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Difficulty:</span>
                <Badge variant="secondary" className="capitalize">
                  {settings.difficulty.replace('-', ' ')}
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Words...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate New Words
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedWords.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold text-center">Generated Words</h2>
            {generatedWords.map((word) => (
              <Card key={word.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{word.word}</CardTitle>
                      <CardDescription className="mt-2 text-base">
                        {word.meaning}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {word.difficulty.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {word.gradeLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {word.nounExample && (
                    <div>
                      <span className="font-semibold text-sm text-muted-foreground">
                        Noun:
                      </span>
                      <p className="text-sm">{word.nounExample}</p>
                    </div>
                  )}
                  {word.verbExample && (
                    <div>
                      <span className="font-semibold text-sm text-muted-foreground">
                        Verb:
                      </span>
                      <p className="text-sm">{word.verbExample}</p>
                    </div>
                  )}
                  {word.adjectiveExample && (
                    <div>
                      <span className="font-semibold text-sm text-muted-foreground">
                        Adjective:
                      </span>
                      <p className="text-sm">{word.adjectiveExample}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AIVocabulary;
