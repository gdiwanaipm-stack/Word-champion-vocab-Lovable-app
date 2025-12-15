import { useState, useEffect } from 'react';

// Usage limits configuration
const LIMITS = {
  MAX_WORDS_PER_DAY: 20, // Maximum words to practice in one day
  MAX_HINTS_PER_SESSION: 3, // Maximum hints per practice session
  BREAK_REMINDER_WORDS: 10, // Suggest break after this many words
  MIN_BREAK_MINUTES: 5, // Minimum break duration in minutes
};

interface UsageState {
  wordsPracticedToday: number;
  hintsUsedThisSession: number;
  sessionStartTime: number;
  lastBreakTime: number;
  breakReminderDismissed: boolean;
}

const getStorageKey = () => `vocab-usage-${new Date().toDateString()}`;
const SESSION_KEY = 'vocab-session-usage';

export function useUsageLimits() {
  const [usage, setUsage] = useState<UsageState>(() => {
    const dailyData = localStorage.getItem(getStorageKey());
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    
    const daily = dailyData ? JSON.parse(dailyData) : { wordsPracticedToday: 0 };
    const session = sessionData ? JSON.parse(sessionData) : { 
      hintsUsedThisSession: 0,
      sessionStartTime: Date.now(),
      lastBreakTime: Date.now(),
      breakReminderDismissed: false
    };
    
    return { ...daily, ...session };
  });

  // Persist to storage when usage changes
  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify({
      wordsPracticedToday: usage.wordsPracticedToday
    }));
    
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      hintsUsedThisSession: usage.hintsUsedThisSession,
      sessionStartTime: usage.sessionStartTime,
      lastBreakTime: usage.lastBreakTime,
      breakReminderDismissed: usage.breakReminderDismissed
    }));
  }, [usage]);

  const incrementWordsCompleted = () => {
    setUsage(prev => ({
      ...prev,
      wordsPracticedToday: prev.wordsPracticedToday + 1
    }));
  };

  const incrementHintsUsed = () => {
    setUsage(prev => ({
      ...prev,
      hintsUsedThisSession: prev.hintsUsedThisSession + 1
    }));
  };

  const dismissBreakReminder = () => {
    setUsage(prev => ({
      ...prev,
      breakReminderDismissed: true,
      lastBreakTime: Date.now()
    }));
  };

  const resetSession = () => {
    setUsage(prev => ({
      ...prev,
      hintsUsedThisSession: 0,
      sessionStartTime: Date.now(),
      lastBreakTime: Date.now(),
      breakReminderDismissed: false
    }));
  };

  // Check if daily limit reached
  const isDailyLimitReached = usage.wordsPracticedToday >= LIMITS.MAX_WORDS_PER_DAY;
  
  // Check if hints limit reached for this session
  const isHintLimitReached = usage.hintsUsedThisSession >= LIMITS.MAX_HINTS_PER_SESSION;
  
  // Calculate remaining hints
  const hintsRemaining = Math.max(0, LIMITS.MAX_HINTS_PER_SESSION - usage.hintsUsedThisSession);
  
  // Calculate remaining words for today
  const wordsRemainingToday = Math.max(0, LIMITS.MAX_WORDS_PER_DAY - usage.wordsPracticedToday);
  
  // Check if break reminder should show
  const shouldShowBreakReminder = 
    !usage.breakReminderDismissed &&
    usage.wordsPracticedToday > 0 &&
    usage.wordsPracticedToday % LIMITS.BREAK_REMINDER_WORDS === 0;

  return {
    // State
    wordsPracticedToday: usage.wordsPracticedToday,
    hintsUsedThisSession: usage.hintsUsedThisSession,
    
    // Limits
    isDailyLimitReached,
    isHintLimitReached,
    hintsRemaining,
    wordsRemainingToday,
    shouldShowBreakReminder,
    
    // Actions
    incrementWordsCompleted,
    incrementHintsUsed,
    dismissBreakReminder,
    resetSession,
    
    // Config (for display)
    limits: LIMITS
  };
}
