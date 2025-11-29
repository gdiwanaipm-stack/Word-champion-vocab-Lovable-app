import { useLocalStorage } from './useLocalStorage';
import { UserSettings, UserProgress, DailyProgress, WeeklyProgress } from '@/types/vocabulary';
import { vocabularyWords } from '@/data/vocabulary';
import { startOfWeek, format, isWithinInterval, addDays } from 'date-fns';

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
  'very-hard': 'very-hard', // Max difficulty
};

// Thresholds: need 80% accuracy on at least 15 words to progress
const PROGRESSION_THRESHOLD = 0.80;
const MIN_WORDS_FOR_PROGRESSION = 15;

export function useVocabulary() {
  const [settings, setSettings] = useLocalStorage<UserSettings>('vocab-settings', defaultSettings);
  const [userProgress, setUserProgress] = useLocalStorage<UserProgress[]>('vocab-progress', []);
  const [dailyProgress, setDailyProgress] = useLocalStorage<DailyProgress[]>('vocab-daily', []);
  const [weeklyProgress, setWeeklyProgress] = useLocalStorage<WeeklyProgress[]>('vocab-weekly', []);

  const getTodaysWords = () => {
    const filtered = vocabularyWords.filter(
      word => word.gradeLevel === settings.gradeLevel && word.difficulty === settings.difficulty
    );
    // Return 3 words, cycling through available ones
    const startIndex = (Math.floor(Date.now() / (1000 * 60 * 60 * 24)) * 3) % filtered.length;
    return filtered.slice(startIndex, startIndex + 3).concat(
      filtered.slice(0, Math.max(0, 3 - (filtered.length - startIndex)))
    );
  };

  const updateProgress = (wordId: string, isCorrect: boolean) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Update user progress for this word
    const existingProgress = userProgress.find(p => p.wordId === wordId);
    if (existingProgress) {
      setUserProgress(prev => prev.map(p => 
        p.wordId === wordId
          ? {
              ...p,
              attempts: p.attempts + 1,
              correct: p.correct + (isCorrect ? 1 : 0),
              lastPracticed: today,
            }
          : p
      ));
    } else {
      setUserProgress(prev => [...prev, {
        wordId,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
        lastPracticed: today,
        startDate: today,
        completionWeeks: 0,
      }]);
    }

    // Update daily progress
    const todayProgress = dailyProgress.find(d => d.date === today);
    if (todayProgress) {
      setDailyProgress(prev => prev.map(d =>
        d.date === today
          ? {
              ...d,
              wordsCompleted: d.wordsCompleted + 1,
              wordsCorrect: d.wordsCorrect + (isCorrect ? 1 : 0),
            }
          : d
      ));
    } else {
      setDailyProgress(prev => [...prev, {
        date: today,
        wordsCompleted: 1,
        wordsCorrect: isCorrect ? 1 : 0,
      }]);
    }
  };

  const getCurrentWeekProgress = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');

    // Count days with progress this week
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
  };

  const getLearnedWords = () => {
    return userProgress
      .filter(p => p.attempts > 0)
      .map(p => {
        const word = vocabularyWords.find(w => w.id === p.wordId);
        return word ? { ...word, progress: p } : null;
      })
      .filter(Boolean);
  };

  const getProgressionStats = () => {
    // Get progress for current difficulty level
    const currentDifficultyWords = userProgress.filter(p => {
      const word = vocabularyWords.find(w => w.id === p.wordId);
      return word?.difficulty === settings.difficulty && word?.gradeLevel === settings.gradeLevel;
    });

    const wordsAtCurrentDifficulty = currentDifficultyWords.length;
    
    // Calculate accuracy for current difficulty
    const totalAttempts = currentDifficultyWords.reduce((sum, p) => sum + p.attempts, 0);
    const totalCorrect = currentDifficultyWords.reduce((sum, p) => sum + p.correct, 0);
    const currentAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    // Check if ready for progression
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
  };

  const checkAndProgressDifficulty = () => {
    if (!settings.autoProgressionEnabled) return null;

    const stats = getProgressionStats();
    
    if (stats.isReadyForProgression && stats.nextDifficulty) {
      setSettings(prev => ({
        ...prev,
        difficulty: stats.nextDifficulty as any,
      }));
      return stats.nextDifficulty;
    }
    
    return null;
  };

  return {
    settings,
    setSettings,
    userProgress,
    dailyProgress,
    weeklyProgress,
    getTodaysWords,
    updateProgress,
    getCurrentWeekProgress,
    getLearnedWords,
    getProgressionStats,
    checkAndProgressDifficulty,
  };
}
