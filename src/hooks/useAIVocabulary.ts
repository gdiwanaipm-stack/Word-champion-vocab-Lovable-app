import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VocabularyWord, GradeLevel, Difficulty } from '@/types/vocabulary';
import { useToast } from '@/hooks/use-toast';

export function useAIVocabulary() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateVocabulary = async (
    gradeLevel: GradeLevel,
    difficulty: Difficulty,
    count: number = 3
  ): Promise<VocabularyWord[]> => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-vocabulary', {
        body: { gradeLevel, difficulty, count }
      });

      if (error) {
        console.error('Error generating vocabulary:', error);
        throw new Error(error.message || 'Failed to generate vocabulary');
      }

      if (!data?.words || !Array.isArray(data.words)) {
        throw new Error('Invalid response format');
      }

      toast({
        title: "New words generated!",
        description: `Generated ${data.words.length} fresh vocabulary words.`,
      });

      return data.words;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate vocabulary';
      
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateVocabulary,
    isGenerating,
  };
}
