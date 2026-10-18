import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CalendarCheck, CheckCircle2, ChevronRight, Coins, Flame, Map, Trophy, Zap, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { calculateStudentStats } from '../../lib/studentStats';

const subjectMeta = {
  math: { emoji: '🔢', label: 'Toán học', color: 'sky' },
  vietnamese: { emoji: '📖', label: 'Tiếng Việt', color: 'azure' }
};

export default function HomePage({ navigate, user }) {
  const [stats, setStats] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentGrade = user?.grade
    ? Number(user.grade)
    : Number(JSON.parse(localStorage.getItem('hoc-vui-user') || '{}').grade || 0);

  useEffect(() => {
    Promise.all([
      api('/progress/me'),
      api('/attendance/me'),
      api('/lessons'),
      api('/assignments'),
      api(studentGrade ? `/subjects?grade=${studentGrade}` : '/subjects').catch(() => []),
    ])
      .then(([prog, att, lsns, asgn, subList]) => {
        setProgress(prog);
        setStats(calculateStudentStats(prog, att, lsns));
        setLessons(lsns);
        setAssignments(asgn);
        if (Array.isArray(subList) && subList.length) setSubjects(subList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentGrade]);

  // Find last-accessed lesson
  const lastRecord = [...progress]
    .filter(r => r.completedAt || r.latestAttempt)
    .sort((a, b) => {
      const da = new Date(a.latestAttempt?.completedAt || a.completedAt || 0);
      const db = new Date(b.latestAttempt?.completedAt || b.completedAt || 0);
      return db - da;
    })[0];

  const lastLesson = lastRecord
    ? lessons.find(l => l._id === (lastRecord.lesson?._id || lastRecord.lesson))
    : null;

  const nextLesson = lessons.find(l => !progress.find(p => (p.lesson?._id || p.lesson) === l._id));

  // Dynamic subject progress filtered by student's grade
  const applicableSubjects = studentGrade
    ? subjects.filter(s => !s.gradeLevels?.length || s.gradeLevels.includes(studentGrade))
    : subjects;

  const displaySubjects = applicableSubjects.length ? applicableSubjects : [
    { key: 'math', name: 'Toán học', icon: '📐', color: 'sky' },
    { key: 'vietnamese', name: 'Tiếng Việt', icon: '📖', color: 'orange' }
  ];

  const subjectProgressList = displaySubjects.map(sub => {
    const sLessons = lessons.filter(l => l.subject === sub.key);
    const done = sLessons.filter(l => progress.find(p => (p.lesson?._id || p.lesson) === l._id && (p.completedAt || p.latestAttempt))).length;
    return {
      key: sub.key,
      label: sub.name,
      emoji: sub.icon || '📚',
      color: sub.color === 'orange' ? 'orange' : sub.color === 'emerald' ? 'mint' : 'sky',
      total: sLessons.length,
      done,
    };
  });

  // Pending assignments
  const pendingAssignments = assignments
    .filter(a => {
      const lessonId = a.lesson?._id || a.lesson;
      const record = progress.find(p => (p.lesson?._id || p.lesson) === lessonId);
      return a.status === 'active' && !record?.completedAt && !record?.latestAttempt;
    })
    .slice(0, 3);

  const goLesson = lesson => {
    if (!lesson) return;
    sessionStorage.setItem('hoc-vui-lesson', lesson._id);
    navigate('lesson');
  };

  const StatCard = ({ icon: Icon, value, label, sub, color, onClick }) => (
    <button type="button" className={`home-stat-card ${color}`} onClick={onClick}>
      <span className="home-stat-icon"><Icon size={22} /></span>
      <b className="home-stat-value">{value}</b>
      <span className="home-stat-label">{label}</span>
      {sub && <span className="home-stat-sub">{sub}</span>}
    </button>
  );

  return (
    <main className="student-main home-dashboard">
      {/* Welcome Hero */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <Sparkles size={14} />
            <span>KHÔNG GIAN HỌC TẬP THÔNG MINH</span>
          </div>
          <h1>Hôm nay học gì nào?</h1>
          <p>Mỗi bài học nhỏ là một viên gạch xây dựng tương lai lớn. Chúc bạn một ngày học thật vui!</p>

          {loading ? (
            <div className="home-hero-btn-skeleton" />
          ) : lastLesson ? (
            <button className="home-cta-btn" onClick={() => goLesson(lastLesson)}>
              <BookOpen size={18} />
              <span>Tiếp tục: <b>{lastLesson.title}</b></span>
              <ArrowRight size={17} />
            </button>
          ) : nextLesson ? (
            <button className="home-cta-btn" onClick={() => goLesson(nextLesson)}>
              <Map size={18} />
              <span>Bắt đầu bài học đầu tiên</span>
              <ArrowRight size={17} />
            </button>
          ) : (
            <button className="home-cta-btn" onClick={() => navigate('map')}>
              <Map size={18} />
              <span>Khám phá bản đồ bài học</span>
              <ArrowRight size={17} />
            </button>
          )}
        </div>
        <div className="home-hero-art" aria-hidden>
          <div className="home-art-mascot">🚀</div>
        </div>
      </section>

      {/* 4 Stats Cards */}
      <section className="home-stats-row">
        {loading ? (
          [0, 1, 2, 3].map(i => <div key={i} className="home-stat-skeleton" />)
        ) : (
          <>
            <StatCard
              icon={Flame}
              value={stats?.streak ?? 0}
              label="Ngày liên tiếp"
              color="streak"
              onClick={() => navigate('attendance')}
            />
            <StatCard
              icon={Coins}
              value={stats?.coins ?? 0}
              label="Xu tích lũy"
              color="coin"
              onClick={() => navigate('award')}
            />
            <StatCard
              icon={BookOpen}
              value={stats?.completedCount ?? 0}
              label="Bài hoàn thành"
              color="lesson"
              onClick={() => navigate('map')}
            />
            <StatCard
              icon={Zap}
              value={`Lv.${stats?.currentLevel ?? 1}`}
              label={stats?.levelTitle || 'Học sinh'}
              sub={`${stats?.totalXP ?? 0} XP`}
              color="xp"
              onClick={() => navigate('award')}
            />
          </>
        )}
      </section>

      {/* Main Grid: Subjects & Daily Quests */}
      <div className="home-grid">
        {/* Subject Progress */}
        <section className="home-card subjects-card">
          <div className="home-card-header">
            <div>
              <h2>Môn học của bạn</h2>
              <p className="home-card-subtitle">Tiến trình theo chương trình học</p>
            </div>
            <button className="home-card-link" onClick={() => navigate('map')}>
              <span>Xem tất cả</span> <ChevronRight size={15} />
            </button>
          </div>

          {loading ? (
            <div className="home-subject-skeletons">
              <div className="home-subject-skeleton" />
              <div className="home-subject-skeleton" />
            </div>
          ) : (
            <div className="home-subjects">
              {subjectProgressList.map(item => {
                const pct = item.total ? Math.round((item.done / item.total) * 100) : 0;
                return (
                  <button key={item.key} className={`home-subject ${item.color}`} onClick={() => navigate('map')}>
                    <span className={`home-subject-emoji ${item.color}`}>{item.emoji}</span>
                    <div className="home-subject-body">
                      <b>{item.label}</b>
                      <small>{item.done}/{item.total} bài hoàn thành</small>
                      <div className="home-progress-bar">
                        <i style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="home-subject-pct">{pct}%</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Daily Quests */}
        <section className="home-card quests-card">
          <div className="home-card-header">
            <div>
              <h2>Nhiệm vụ hôm nay</h2>
              <p className="home-card-subtitle">Hoàn thành để nhận quà</p>
            </div>
            <span className="quest-badge">Mỗi ngày</span>
          </div>

          <div className="home-quests">
            <div
              className={`home-quest ${stats?.checkedInToday ? 'done' : ''}`}
              onClick={() => navigate('attendance')}
              role="button"
              tabIndex={0}
            >
              <span className="quest-icon attendance">
                {stats?.checkedInToday ? <CheckCircle2 size={20} /> : <CalendarCheck size={20} />}
              </span>
              <div>
                <b>Điểm danh hôm nay</b>
                <small>+5 xu · +20 XP thưởng</small>
              </div>
              {stats?.checkedInToday && <span className="quest-done-chip">Hoàn thành ✓</span>}
            </div>

            <div
              className={`home-quest ${(stats?.completedCount ?? 0) > 0 ? 'done' : ''}`}
              onClick={() => navigate('map')}
              role="button"
              tabIndex={0}
            >
              <span className="quest-icon lesson"><BookOpen size={20} /></span>
              <div>
                <b>Hoàn thành 1 bài học</b>
                <small>+10 xu · +50 XP thưởng</small>
              </div>
              {(stats?.completedCount ?? 0) > 0 && <span className="quest-done-chip">Hoàn thành ✓</span>}
            </div>

            <div className="home-quest" onClick={() => navigate('award')} role="button" tabIndex={0}>
              <span className="quest-icon trophy"><Trophy size={20} /></span>
              <div>
                <b>Khám phá huy hiệu</b>
                <small>Mở khóa các cột mốc mới</small>
              </div>
              <ChevronRight size={18} className="quest-chevron" />
            </div>
          </div>
        </section>
      </div>

      {/* Pending Assignments */}
      {!loading && pendingAssignments.length > 0 && (
        <section className="home-card pending-card">
          <div className="home-card-header">
            <div>
              <h2>📋 Bài tập cần nộp</h2>
              <p className="home-card-subtitle">Nhiệm vụ do thầy cô giao</p>
            </div>
            <button className="home-card-link" onClick={() => navigate('assignments')}>
              <span>Xem tất cả</span> <ChevronRight size={15} />
            </button>
          </div>

          <div className="home-assignments">
            {pendingAssignments.map(a => {
              const lesson = a.lesson || {};
              const due = a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : 'Không giới hạn';
              const meta = subjectMeta[lesson.subject] || { emoji: '📚', label: 'Bài học', color: 'sky' };
              return (
                <div
                  key={a._id}
                  className="home-assignment-row"
                  onClick={() => {
                    sessionStorage.setItem('hoc-vui-lesson', lesson._id);
                    navigate('lesson');
                  }}
                >
                  <span className={`home-assignment-emoji ${meta.color}`}>{meta.emoji}</span>
                  <div>
                    <b>{lesson.title || 'Bài học'}</b>
                    <small>Hạn nộp: {due}</small>
                  </div>
                  <button className="home-assignment-go">
                    <span>Làm bài</span> <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
