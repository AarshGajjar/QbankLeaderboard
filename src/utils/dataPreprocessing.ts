export const DAILY_TARGET = 200;
export const MIN_ACCURACY_TARGET = 70;

export const getDate = () => {
  return new Date().toISOString();
};

export const calculateMetrics = (stats: { completed: number; correct: number }) => {
  const accuracy = Number((stats.correct / stats.completed * 100).toFixed(2)) || 0;
  const accuracyBonus = accuracy >= 80 ? (accuracy - 80) * 2 : 0;
  const points = Math.round(stats.completed + (accuracyBonus * stats.completed / 100));
  return { accuracy, points };
};

export const calculateDailyAverage = (userData: any[]) => {
  if (!userData || userData.length === 0) return 0;

  const today = new Date();
  const todayUTCMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const validData = userData.filter(day => {
    if (!day?.date) return false;
    const date = new Date(day.date);
    const utcDay = date.getUTCDay();
    if (utcDay === 0) return false; // Exclude Sundays

    const dayUTCMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return dayUTCMidnight < todayUTCMidnight; // Exclude current day
  });

  if (validData.length === 0) return 0;

  const totalCompleted = validData.reduce((sum, day) => sum + (day?.completed || 0), 0);
  return Math.round(totalCompleted / validData.length);
};

export const calculateConsistencyAndStreak = (userData: any[]) => {
  if (!userData || userData.length === 0) return { consistency: 0, streak: 0, longestStreak: 0 };

  const today = new Date();
  const todayUTCMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const validData = userData
    .filter(day => {
      if (!day?.date) return false;
      const date = new Date(day.date);
      const utcDay = date.getUTCDay();
      if (utcDay === 0) return false; // Exclude Sundays

      const dayUTCMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      return dayUTCMidnight < todayUTCMidnight; // Exclude current day
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (validData.length === 0) return { consistency: 0, streak: 0, longestStreak: 0 };

  // Calculate consistency
  const consistentDays = validData.filter(day => {
    const accuracy = (day.correct / day.completed * 100).toFixed(2);
    return day.completed >= DAILY_TARGET * 0.5 && parseFloat(accuracy) >= MIN_ACCURACY_TARGET;
  });
  const consistency = Number((consistentDays.length / validData.length * 100).toFixed(2));

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  // Calculate current streak (from most recent backwards)
  for (let i = validData.length - 1; i >= 0; i--) {
    const day = validData[i];
    if (day.completed >= DAILY_TARGET) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let tempStreak = 0;
  for (const day of validData) {
    if (day.completed >= DAILY_TARGET) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  streak = currentStreak;

  return { consistency, streak, longestStreak };
};