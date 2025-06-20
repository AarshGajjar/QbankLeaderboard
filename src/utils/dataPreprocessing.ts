export const DAILY_TARGET = 200;
export const MIN_ACCURACY_TARGET = 70;

export const getDate = () => {
  return new Date().toISOString();
};

const getUTCMidnight = (date: Date) => {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

export const calculateDailyAverage = (userData: any[]) => {
  if (!userData || userData.length === 0) return 0;

  const today = new Date();
  const todayUTCMidnight = getUTCMidnight(today);

  const nonSundayData = userData.filter(day => {
    if (!day?.date) return false;
    const date = new Date(day.date);
    const utcDay = date.getUTCDay();
    if (utcDay === 0) return false; // Exclude Sundays

    const dayUTCMidnight = getUTCMidnight(date);
    return dayUTCMidnight < todayUTCMidnight; // Exclude current day
  });

  if (nonSundayData.length === 0) return 0;

  const totalCompleted = nonSundayData.reduce((sum, day) => sum + (day?.completed || 0), 0);
  return Math.round(totalCompleted / nonSundayData.length);
};

export const calculateConsistencyAndStreak = (userData: any[]) => {
  if (!userData || userData.length === 0) return { consistency: 0, streak: 0, longestStreak: 0 };

  const today = new Date();
  const todayUTCMidnight = getUTCMidnight(today);

  const validData = userData
    .filter(day => {
      if (!day?.date) return false;
      const date = new Date(day.date);
      const utcDay = date.getUTCDay();
      if (utcDay === 0) return false; // Exclude Sundays

      const dayUTCMidnight = getUTCMidnight(date);
      return dayUTCMidnight < todayUTCMidnight; // Exclude current day
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // FIXED: Changed to ascending order (oldest first)

  if (validData.length === 0) return { consistency: 0, streak: 0, longestStreak: 0 };

  // Calculate consistency
  const consistentDays = validData.filter(day => {
    const accuracy = (day.correct / day.completed * 100).toFixed(2);
    return day.completed >= DAILY_TARGET * 0.5 && parseFloat(accuracy) >= MIN_ACCURACY_TARGET;
  });
  const consistency = Number((consistentDays.length / validData.length * 100).toFixed(2));

  // Calculate streak with Sunday skipping
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  let prevDateUTC: number | null = null;

  // Calculate longest streak first
  for (let i = 0; i < validData.length; i++) {
    const day = validData[i];
    if (day.completed >= DAILY_TARGET) {
      const currentDate = new Date(day.date);
      const currentUTCMidnight = getUTCMidnight(currentDate);

      if (prevDateUTC === null) {
        // First day in a potential streak
        currentStreak = 1;
        prevDateUTC = currentUTCMidnight;
      } else {
        // Calculate the expected next day (skipping Sundays)
        const oneDayMs = 86400000;
        let expectedDateUTC: number = prevDateUTC + oneDayMs; // Going forward in time
        let expectedDate = new Date(expectedDateUTC);
        
        // Skip Sundays when calculating expected date
        while (expectedDate.getUTCDay() === 0) {
          expectedDateUTC += oneDayMs;
          expectedDate = new Date(expectedDateUTC);
        }

        if (expectedDateUTC === currentUTCMidnight) {
          // Days are consecutive (accounting for Sunday skips)
          currentStreak++;
        } else {
          // Break in the streak, check if it's the longest
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
        prevDateUTC = currentUTCMidnight;
      }
    } else {
      // Day didn't meet target, check if current streak is longest
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 0;
      prevDateUTC = null;
    }
  }
  // Check one final time in case the longest streak is the last one
  longestStreak = Math.max(longestStreak, currentStreak);

  // Reset variables for current streak calculation
  currentStreak = 0;
  prevDateUTC = null;

  // Calculate current streak (keeping existing code)
  for (let i = validData.length - 1; i >= 0; i--) {
    const day = validData[i];
    if (day.completed >= DAILY_TARGET) {
      const currentDate = new Date(day.date);
      const currentUTCMidnight = getUTCMidnight(currentDate);

      if (prevDateUTC === null) {
        // First day in the streak (most recent qualifying day)
        currentStreak = 1;
        prevDateUTC = currentUTCMidnight;
      } else {
        // Calculate the expected previous day (skipping Sundays)
        const oneDayMs = 86400000;
        let expectedDateUTC: number = prevDateUTC - oneDayMs; // Going backward in time
        let expectedDate = new Date(expectedDateUTC);
        
        // Skip Sundays when calculating expected date
        while (expectedDate.getUTCDay() === 0) {
          expectedDateUTC -= oneDayMs;
          expectedDate = new Date(expectedDateUTC);
        }

        if (expectedDateUTC === currentUTCMidnight) {
          // Days are consecutive (accounting for Sunday skips)
          currentStreak++;
        } else {
          // Break in the streak
          break;
        }
        prevDateUTC = currentUTCMidnight;
      }
    } else {
      // Day didn't meet target, break the streak
      break;
    }
  }

  // Current streak is the final calculated streak
  streak = currentStreak;

  return { consistency, streak, longestStreak };
};

export const calculateMetrics = (stats: { completed: number; correct: number }) => {
  const accuracy = Number((stats.correct / stats.completed * 100).toFixed(2)) || 0;
  const accuracyBonus = accuracy >= 80 ? (accuracy - 80) * 2 : 0;
  const points = Math.round(stats.completed + (accuracyBonus * stats.completed / 100));
  return { accuracy, points };
};