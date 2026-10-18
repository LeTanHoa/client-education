import { useEffect, useState } from 'react';
import { CheckCircle2, LockKeyhole, Star, RefreshCw, Map, Zap, Coins, Flame, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';
import StudentEmptyState from '../../components/StudentEmptyState';
import { calculateStudentStats } from '../../lib/studentStats';

export default function AchievementPage({ navigate, user }) {
  const [data, setData] = useState({ progress: [], attendance: null, lessons: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [progress, attendance, lessons] = await Promise.all([
        api('/progress/me'),
        api('/attendance/me'),
        api('/lessons')
      ]);
      setData({ progress, attendance, lessons });
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const stats = calculateStudentStats(data.progress, data.attendance, data.lessons, user);
  const { completedCount, totalCorrect, streak, totalXP, currentLevel, levelXP, coins, levelTitle } = stats;

  const perfect = data.progress.some(r => r.score === 100);
  const badges = [
    { icon: '🌱', title: 'Bước đầu tiên', description: 'Hoàn thành bài học đầu tiên.', value: completedCount, goal: 1 },
    { icon: '📚', title: 'Ham học hỏi', description: 'Hoàn thành 5 bài học.', value: completedCount, goal: 5 },
    { icon: '🎯', title: 'Trả lời chính xác', description: 'Trả lời đúng 10 câu hỏi.', value: totalCorrect, goal: 10 },
    { icon: '🔥', title: 'Đều đặn mỗi ngày', description: 'Điểm danh 5 ngày liên tiếp.', value: streak, goal: 5 },
    { icon: '💯', title: 'Điểm tuyệt đối', description: 'Đạt 100% trong một bài học.', value: perfect ? 1 : 0, goal: 1 },
    { icon: '⚡', title: 'Siêu năng lượng', description: 'Tích lũy 200 XP.', value: totalXP, goal: 200 },
  ];
  const earned = badges.filter(b => b.value >= b.goal).length;
  const hasStarted = completedCount > 0 || totalCorrect > 0 || streak > 0;

  if (loading) return (
    <main className="student-main">
      <div className="student-skeleton-hero" />
      <div className="student-loading-grid badge-grid">
        {[0, 1, 2].map(i => <div className="student-skeleton-card" key={i}><i /><span /><b /><small /></div>)}
      </div>
    </main>
  );

  if (error) return (
    <main className="student-main">
      <StudentEmptyState
        icon={<RefreshCw size={30} />}
        title="Chưa tải được thành tích"
        description="Thử tải lại để xem huy hiệu và bước tiến của bạn."
        action="Thử lại"
        onAction={load}
      />
    </main>
  );

  return (
    <main className="student-main">
      {/* Hero */}
      <section className="ach-hero">
        <div className="ach-trophy-box">🏆</div>
        <div className="ach-hero-text">
          <span className="eyebrow-sky">BẢNG DANH DỰ HỌC SINH</span>
          <h1>Thành tích &amp; Huy hiệu vinh danh</h1>
          <p>Mỗi bước tiến nhỏ của bạn hôm nay đều xứng đáng được ghi nhận và tự hào!</p>
          <div className="ach-hero-badge-count">
            <span>Đã mở khóa: <b>{earned}/{badges.length} huy hiệu</b></span>
          </div>
        </div>
      </section>

      {/* Level & XP Progression Card */}
      <section className="ach-level-card">
        <div className="ach-level-info">
          <div className="ach-level-badge">Cấp độ {currentLevel}</div>
          <div>
            <b>{levelTitle}</b>
            <small>{levelXP}/100 XP để thăng cấp tiếp theo</small>
          </div>
        </div>
        <div className="ach-level-bar">
          <div className="ach-level-progress" style={{ width: `${levelXP}%` }} />
        </div>
        <div className="ach-mini-stats">
          <span><Zap size={16} /> <b>{totalXP}</b> XP tích lũy</span>
          <span><Coins size={16} /> <b>{coins}</b> Xu thưởng</span>
          <span><Flame size={16} /> <b>{streak}</b> Ngày liên tiếp</span>
        </div>
      </section>

      {/* Empty state hint */}
      {!hasStarted && (
        <StudentEmptyState
          compact
          icon={<Map size={27} />}
          title="Huy hiệu đầu tiên đang chờ bạn"
          description="Hãy hoàn thành một bài học hoặc điểm danh để kích hoạt bộ sưu tập thành tích của bạn."
          action="Bắt đầu học ngay"
          onAction={() => navigate?.('map')}
        />
      )}

      {/* Badge Grid */}
      <section className="ach-badge-grid">
        {badges.map(badge => {
          const unlocked = badge.value >= badge.goal;
          const progress = Math.min(100, Math.round((badge.value / badge.goal) * 100));
          return (
            <article className={`ach-badge-card ${unlocked ? 'unlocked' : 'locked'}`} key={badge.title}>
              <div className="ach-badge-icon-wrap">
                <span className="ach-badge-emoji">{badge.icon}</span>
                {unlocked && <span className="ach-badge-glow" />}
              </div>
              <h3>{badge.title}</h3>
              <p>{badge.description}</p>
              <div className="ach-badge-bar">
                <i style={{ width: `${progress}%` }} />
              </div>
              <small>
                {unlocked ? (
                  <span className="ach-unlocked-tag"><CheckCircle2 size={13} /> Đã đạt được</span>
                ) : (
                  <span className="ach-locked-tag"><LockKeyhole size={12} /> {Math.min(badge.value, badge.goal)}/{badge.goal}</span>
                )}
              </small>
            </article>
          );
        })}
      </section>

      {earned > 0 && (
        <p className="ach-footer-note">
          <Sparkles size={16} /> <span>Tuyệt vời! Tiếp tục nỗ lực rèn luyện để mở khóa thêm nhiều huy hiệu mới nhé.</span>
        </p>
      )}
    </main>
  );
}
