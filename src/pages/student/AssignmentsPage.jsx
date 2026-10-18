import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, Clock3, RefreshCw, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';
import StudentEmptyState from '../../components/StudentEmptyState';

const dueLabel = v => v ? new Date(v).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Không giới hạn';
const subjectMeta = { math: { emoji: '🔢', label: 'TOÁN HỌC', color: 'sky' }, vietnamese: { emoji: '📖', label: 'TIẾNG VIỆT', color: 'azure' } };

const TABS = [
  { id: 'all', label: 'Tất cả bài tập' },
  { id: 'pending', label: 'Cần hoàn thành' },
  { id: 'done', label: 'Đã hoàn thành' },
];

export default function StudentAssignmentsPage({ navigate }) {
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [assigned, records] = await Promise.all([api('/assignments'), api('/progress/me')]);
      setAssignments(assigned); setProgress(records);
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => assignments.map(a => {
    const lessonId = a.lesson?._id || a.lesson;
    const record = progress.find(r => (r.lesson?._id || r.lesson) === lessonId);
    const attempt = record?.latestAttempt;
    return {
      ...a,
      record,
      completed: Boolean(record?.completedAt || attempt),
      score: attempt?.score ?? record?.score ?? null,
      completedAt: attempt?.completedAt ?? record?.completedAt ?? null
    };
  }), [assignments, progress]);

  const completedCount = rows.filter(r => r.completed).length;
  const pendingCount = rows.filter(r => !r.completed && r.status === 'active').length;

  const displayed = tab === 'pending'
    ? rows.filter(r => !r.completed && r.status === 'active')
    : tab === 'done'
      ? rows.filter(r => r.completed)
      : rows;

  const start = item => {
    if (item.status !== 'active') return;
    sessionStorage.setItem('hoc-vui-lesson', item.lesson?._id || item.lesson);
    navigate('lesson');
  };

  if (loading) return (
    <main className="student-main">
      <div className="student-skeleton-hero" />
      <div className="student-loading-grid">
        {[0, 1, 2].map(i => <div className="student-skeleton-card" key={i}><i /><span /><b /><small /></div>)}
      </div>
    </main>
  );

  if (error) return (
    <main className="student-main">
      <StudentEmptyState
        icon={<RefreshCw size={30} />}
        title="Chưa tải được bài tập"
        description="Thử tải lại để xem bài tập thầy cô giao cho bạn."
        action="Thử lại"
        onAction={load}
      />
    </main>
  );

  return (
    <main className="student-main">
      {/* Hero */}
      <header className="asgn-hero">
        <div className="asgn-hero-content">
          <span className="eyebrow-sky">NHIỆM VỤ ĐƯỢC GIAO</span>
          <h1>Bài tập về nhà &amp; Lớp học</h1>
          <p>Cùng hoàn thành từng bài tập đúng hạn để nhận thêm điểm thưởng và củng cố kiến thức nhé!</p>
        </div>
        <div className="asgn-hero-icon-box">
          <span className="asgn-hero-icon">📚</span>
        </div>
      </header>

      {/* Stats row */}
      <section className="asgn-stats">
        <article className="asgn-stat-card">
          <span className="asgn-stat-icon sky"><BookOpen size={20} /></span>
          <div>
            <small>Tổng bài được giao</small>
            <b>{rows.length}</b>
          </div>
        </article>
        <article className="asgn-stat-card">
          <span className="asgn-stat-icon emerald"><CheckCircle2 size={20} /></span>
          <div>
            <small>Đã hoàn thành</small>
            <b>{completedCount}</b>
          </div>
        </article>
        <article className="asgn-stat-card">
          <span className="asgn-stat-icon amber"><Clock3 size={20} /></span>
          <div>
            <small>Cần hoàn thành</small>
            <b>{pendingCount}</b>
          </div>
        </article>
      </section>

      {/* Filter tabs */}
      <div className="asgn-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`asgn-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.label}</span>
            {t.id === 'pending' && pendingCount > 0 && (
              <span className="asgn-tab-badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {displayed.length ? (
        <section className="asgn-grid">
          {displayed.map(item => {
            const closed = item.status === 'closed';
            const lesson = item.lesson || {};
            const meta = subjectMeta[lesson.subject] || { emoji: '📚', label: 'BÀI HỌC', color: 'sky' };

            return (
              <article className={`asgn-card ${item.completed ? 'is-done' : closed ? 'is-closed' : ''}`} key={item._id}>
                <div className="asgn-card-top">
                  <span className={`asgn-card-emoji ${meta.color}`}>{meta.emoji}</span>
                  <span className={`asgn-status-pill ${item.completed ? 'done' : closed ? 'closed' : 'todo'}`}>
                    {item.completed ? '✓ Đã hoàn thành' : closed ? 'Đã đóng' : 'Cần nộp'}
                  </span>
                </div>

                <span className="asgn-subject-label">{meta.label} · LỚP {lesson.grade || '—'}</span>
                <h2>{lesson.title || 'Bài học đã được cập nhật'}</h2>

                <div className="asgn-meta">
                  <span><CalendarDays size={14} /> Hạn nộp: {dueLabel(item.dueDate)}</span>
                  {item.completed && item.score !== null && (
                    <span className="asgn-meta-score"><CheckCircle2 size={14} /> Điểm số: {item.score}%</span>
                  )}
                </div>

                {item.completedAt && (
                  <small className="asgn-completed-date">Hoàn thành ngày {new Date(item.completedAt).toLocaleDateString('vi-VN')}</small>
                )}

                <button
                  className={`asgn-action ${item.completed ? 'outline' : 'primary-sky'}`}
                  disabled={closed || !item.lesson}
                  onClick={() => start(item)}
                >
                  <span>{closed ? 'Bài đã đóng' : item.completed ? 'Làm lại bài' : 'Bắt đầu làm bài'}</span>
                  <span>→</span>
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <StudentEmptyState
          icon={<BookOpen size={31} />}
          title={tab === 'pending' ? 'Tuyệt vời! Không có bài nào cần nộp' : tab === 'done' ? 'Bạn chưa hoàn thành bài nào' : 'Chưa có bài tập được giao'}
          description={tab === 'all' ? 'Khi thầy cô giao bài tập mới, các nhiệm vụ sẽ xuất hiện tại đây.' : 'Thay đổi bộ lọc để xem các bài tập khác nhé.'}
          action={tab === 'all' ? 'Khám phá bài học tự do' : undefined}
          onAction={tab === 'all' ? () => navigate('map') : undefined}
        />
      )}
    </main>
  );
}
