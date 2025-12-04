import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { UserSettings, UserProgress, DailyProgress as LocalDailyProgress } from '@/types/vocabulary';
import { vocabularyWords } from '@/data/vocabulary';
import { startOfWeek, format, addDays } from 'date-fns';

const defaultSettings: UserSettings = {
  gradeLevel: 'elementary',
  difficulty: 'easy',
  darkMode: false,
  autoProgressionEnabled: true,
};

const DIFFICULTY_PROGRESSION: { [key: string]: string } = {
  'easy': 'medium',
  'medium': 'hard',
  'hard': 'very-hard',
  'very-hard': 'very-hard',
};

const PROGRESSION_THRESHOLD = 0.80;
const MIN_WORDS_FOR_PROGRESSION = 15;

export function useVocabularyDB() {
  const { user } = useAuth();
  const [settings, setSettingsState] = useState<UserSettings>(defaultSettings);
  const [userProgress, setUserProgressState] = useState<UserProgress[]>([]);
  const [dailyProgress, setDailyProgressState] = useState<LocalDailyProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch settings from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (settingsData) {
        setSettingsState({
          gradeLevel: settingsData.grade_level as any,
          difficulty: settingsData.difficulty as any,
          darkMode: settingsData.dark_mode,
          autoProgressionEnabled: settingsData.auto_progression,
        });
      } else {
        // Create default settings for new user
        await supabase.from('user_settings').insert({
          user_id: user.id,
          grade_level: defaultSettings.gradeLevel,
          difficulty: defaultSettings.difficulty,
          dark_mode: defaultSettings.darkMode,
          auto_progression: defaultSettings.autoProgressionEnabled,
        });
      }

      // Fetch progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (progressData) {
        setUserProgressState(progressData.map(p => ({
          wordId: p.word_id,
          attempts: p.attempts,
          correct: p.correct,
          lastPracticed: p.last_practiced || '',
          startDate: p.created_at,
          completionWeeks: 0,
          difficult: p.is_difficult,
        })));
      }

      // Fetch daily progress
      const { data: dailyData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (dailyData) {
        setDailyProgressState(dailyData.map(d => ({
          date: d.date,
          wordsCompleted: d.words_practiced,
          wordsCorrect: d.words_correct,
        })));
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const setSettings = useCallback(async (newSettings: UserSettings | ((prev: UserSettings) => UserSettings)) => {
    const updated = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    setSettingsState(updated);
    
    if (user) {
      await supabase
        .from('user_settings')
        .update({
          grade_level: updated.gradeLevel,
          difficulty: updated.difficulty,
          dark_mode: updated.darkMode,
          auto_progression: updated.autoProgressionEnabled,
        })
        .eq('user_id', user.id);
    }
  }, [user, settings]);

  const getTodaysWords = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const filtered = vocabularyWords.filter(
      word => word.gradeLevel === settings.gradeLevel && word.difficulty === settings.difficulty
    );
    
    // Get words practiced today
    const practicedTodayIds = userProgress
      .filter(p => p.lastPracticed === today)
      .map(p => p.wordId);
    
    // Filter out words already completed today (practiced at least twice today)
    const todayAttempts = new Map<string, number>();
    userProgress.forEach(p => {
      if (p.lastPracticed === today) {
        todayAttempts.set(p.wordId, p.attempts);
      }
    });
    
    // Get words not yet fully practiced today
    const availableWords = filtered.filter(word => {
      const attempts = todayAttempts.get(word.id) || 0;
      return attempts < 2; // Each word needs 2 rounds
    });
    
    // If all words are completed, return fresh words from the full list
    if (availableWords.length === 0) {
      const startIndex = (Math.floor(Date.now() / (1000 * 60 * 60 * 24)) * 2) % filtered.length;
      return filtered.slice(startIndex, startIndex + 2).concat(
        filtered.slice(0, Math.max(0, 2 - (filtered.length - startIndex)))
      );
    }
    
    // Return next 2 available words
    const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const startIndex = (dayOffset * 2) % availableWords.length;
    return availableWords.slice(startIndex, startIndex + 2).concat(
      availableWords.slice(0, Math.max(0, 2 - (availableWords.length - startIndex)))
    );
  }, [settings.gradeLevel, settings.difficulty, userProgress]);

  const updateProgress = useCallback(async (wordId: string, isCorrect: boolean) => {
    if (!user) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Update user progress
    const existing = userProgress.find(p => p.wordId === wordId);
    if (existing) {
      const updated = {
        ...existing,
        attempts: existing.attempts + 1,
        correct: existing.correct + (isCorrect ? 1 : 0),
        lastPracticed: today,
      };
      setUserProgressState(prev => prev.map(p => p.wordId === wordId ? updated : p));
      
      await supabase
        .from('user_progress')
        .update({
          attempts: updated.attempts,
          correct: updated.correct,
          last_practiced: today,
        })
        .eq('user_id', user.id)
        .eq('word_id', wordId);
    } else {
      const newProgress: UserProgress = {
        wordId,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
        lastPracticed: today,
        startDate: today,
        completionWeeks: 0,
      };
      setUserProgressState(prev => [...prev, newProgress]);
      
      await supabase.from('user_progress').insert({
        user_id: user.id,
        word_id: wordId,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
        last_practiced: today,
      });
    }

    // Update daily progress
    const todayProgress = dailyProgress.find(d => d.date === today);
    if (todayProgress) {
      const updated = {
        ...todayProgress,
        wordsCompleted: todayProgress.wordsCompleted + 1,
        wordsCorrect: todayProgress.wordsCorrect + (isCorrect ? 1 : 0),
      };
      setDailyProgressState(prev => prev.map(d => d.date === today ? updated : d));
      
      await supabase
        .from('daily_progress')
        .update({
          words_practiced: updated.wordsCompleted,
          words_correct: updated.wordsCorrect,
        })
        .eq('user_id', user.id)
        .eq('date', today);
    } else {
      const newDaily = {
        date: today,
        wordsCompleted: 1,
        wordsCorrect: isCorrect ? 1 : 0,
      };
      setDailyProgressState(prev => [...prev, newDaily]);
      
      await supabase.from('daily_progress').insert({
        user_id: user.id,
        date: today,
        words_practiced: 1,
        words_correct: isCorrect ? 1 : 0,
      });
    }
  }, [user, userProgress, dailyProgress]);

  const getCurrentWeekProgress = useCallback(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');

    const daysInWeek = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return format(date, 'yyyy-MM-dd');
    });

    const daysCompleted = daysInWeek.filter(date =>
      dailyProgress.some(d => d.date === date && d.wordsCompleted > 0)
    ).length;

    const totalWords = dailyProgress
      .filter(d => daysInWeek.includes(d.date))
      .reduce((sum, d) => sum + d.wordsCompleted, 0);

    let reward: 'none' | 'silver' | 'gold' = 'none';
    if (daysCompleted >= 7) reward = 'gold';
    else if (daysCompleted >= 5) reward = 'silver';

    return { weekStart: weekStartStr, daysCompleted, totalWords, reward };
  }, [dailyProgress]);

  const getLearnedWords = useCallback(() => {
    return userProgress
      .filter(p => p.attempts > 0)
      .map(p => {
        const word = vocabularyWords.find(w => w.id === p.wordId);
        return word ? { ...word, progress: p } : null;
      })
      .filter(Boolean);
  }, [userProgress]);

  const getProgressionStats = useCallback(() => {
    const currentDifficultyWords = userProgress.filter(p => {
      const word = vocabularyWords.find(w => w.id === p.wordId);
      return word?.difficulty === settings.difficulty && word?.gradeLevel === settings.gradeLevel;
    });

    const wordsAtCurrentDifficulty = currentDifficultyWords.length;
    const totalAttempts = currentDifficultyWords.reduce((sum, p) => sum + p.attempts, 0);
    const totalCorrect = currentDifficultyWords.reduce((sum, p) => sum + p.correct, 0);
    const currentAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    const isReadyForProgression = 
      wordsAtCurrentDifficulty >= MIN_WORDS_FOR_PROGRESSION && 
      currentAccuracy >= PROGRESSION_THRESHOLD &&
      settings.difficulty !== 'very-hard';

    const nextDifficulty = DIFFICULTY_PROGRESSION[settings.difficulty] as any;

    return {
      currentAccuracy,
      wordsAtCurrentDifficulty,
      isReadyForProgression,
      nextDifficulty: nextDifficulty !== settings.difficulty ? nextDifficulty : null,
      progressionThreshold: PROGRESSION_THRESHOLD,
    };
  }, [userProgress, settings.difficulty, settings.gradeLevel]);

  const checkAndProgressDifficulty = useCallback(async () => {
    if (!settings.autoProgressionEnabled) return null;

    const stats = getProgressionStats();
    
    if (stats.isReadyForProgression && stats.nextDifficulty) {
      await setSettings(prev => ({
        ...prev,
        difficulty: stats.nextDifficulty as any,
      }));
      return stats.nextDifficulty;
    }
    
    return null;
  }, [settings.autoProgressionEnabled, getProgressionStats, setSettings]);

  const toggleDifficultWord = useCallback(async (wordId: string) => {
    if (!user) return;
    
    const existing = userProgress.find(p => p.wordId === wordId);
    
    if (existing) {
      const newDifficult = !existing.difficult;
      setUserProgressState(prev => prev.map(p => 
        p.wordId === wordId ? { ...p, difficult: newDifficult } : p
      ));
      
      await supabase
        .from('user_progress')
        .update({ is_difficult: newDifficult })
        .eq('user_id', user.id)
        .eq('word_id', wordId);
    } else {
      const today = format(new Date(), 'yyyy-MM-dd');
      setUserProgressState(prev => [...prev, {
        wordId,
        attempts: 0,
        correct: 0,
        lastPracticed: today,
        startDate: today,
        completionWeeks: 0,
        difficult: true,
      }]);
      
      await supabase.from('user_progress').insert({
        user_id: user.id,
        word_id: wordId,
        attempts: 0,
        correct: 0,
        is_difficult: true,
      });
    }
  }, [user, userProgress]);

  const getDifficultWords = useCallback(() => {
    return userProgress
      .filter(p => p.difficult)
      .map(p => {
        const word = vocabularyWords.find(w => w.id === p.wordId);
        return word ? { ...word, progress: p } : null;
      })
      .filter(Boolean);
  }, [userProgress]);

  const isWordDifficult = useCallback((wordId: string) => {
    return userProgress.find(p => p.wordId === wordId)?.difficult || false;
  }, [userProgress]);

  return {
    settings,
    setSettings,
    userProgress,
    dailyProgress,
    weeklyProgress: [],
    getTodaysWords,
    updateProgress,
    getCurrentWeekProgress,
    getLearnedWords,
    getProgressionStats,
    checkAndProgressDifficulty,
    toggleDifficultWord,
    getDifficultWords,
    isWordDifficult,
    loading,
  };
}
