export function calculateStudentStats(progress = [], attendance = null, lessons = [], user = null) {
  const completedRecords = progress.filter(p => p.completedAt || p.latestAttempt);
  const totalCorrect = progress.reduce((sum, p) => {
    const attempt = p.latestAttempt;
    if (attempt) return sum + (attempt.correctCount || 0);
    return sum + (p.answers || []).filter(a => a.correct).length;
  }, 0);

  const streak = attendance?.streak || 0;
  const totalDays = attendance?.totalDays || 0;
  const checkedInToday = Boolean(attendance?.checkedInToday);

  const baseXP = Number(attendance?.baseXP ?? user?.baseXP ?? 0);
  const baseCoins = Number(attendance?.baseCoins ?? user?.baseCoins ?? 0);

  // Gamification stats calculated consistently
  const totalXP = baseXP + (totalCorrect * 10) + (completedRecords.length * 50) + (totalDays * 20);
  const currentLevel = Math.max(1, Math.floor(totalXP / 100) + 1);
  const levelXP = totalXP % 100;
  const coins = baseCoins + (completedRecords.length * 10) + (totalDays * 5);

  const levelTitles = [
    'Tập sự khám phá',
    'Ong vàng chăm chỉ',
    'Nhà thông thái nhí',
    'Siêu sao học tập',
    'Dũng sĩ tri thức',
    'Bậc thầy H'
  ];
  const levelTitle = levelTitles[Math.min(currentLevel - 1, levelTitles.length - 1)];

  return {
    streak,
    totalDays,
    checkedInToday,
    totalXP,
    currentLevel,
    levelXP,
    levelTitle,
    coins,
    completedCount: completedRecords.length,
    totalCorrect,
    totalLessons: lessons.length
  };
}

