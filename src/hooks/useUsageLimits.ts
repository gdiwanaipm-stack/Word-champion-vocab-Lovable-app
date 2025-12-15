import { useState, useEffect } from 'react';

// Usage limits configuration
const LIMITS = {
  MAX_WORDS_PER_DAY: 20, // Maximum words to practice in one day
  BREAK_REMINDER_WORDS: 10, // Suggest break after this many words
};

interface UsageState {
  wordsPracticedToday: number;
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
      sessionStartTime: Date.now(),
      lastBreakTime: Date.now(),
      breakReminderDismissed: false
    }));
  };

  // Check if daily limit reached
  const isDailyLimitReached = usage.wordsPracticedToday >= LIMITS.MAX_WORDS_PER_DAY;
  
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
    
    // Limits
    isDailyLimitReached,
    wordsRemainingToday,
    shouldShowBreakReminder,
    
    // Actions
    incrementWordsCompleted,
    dismissBreakReminder,
    resetSession,
    
    // Config (for display)
    limits: LIMITS
  };
}
