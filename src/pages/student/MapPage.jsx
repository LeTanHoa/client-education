import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Star, RefreshCw, Filter, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import ProgressBar from '../../components/ProgressBar';
import StudentEmptyState from '../../components/StudentEmptyState';
import { toast } from '../../components/Toast';

const answerText = value => Array.isArray(value) ? value.join(' → ') : value && typeof value === 'object' ? Object.entries(value).map(([a, b]) => `${a} → ${b}`).join(' · ') : value;
const dateText = value => value ? new Date(value).toLocaleString('vi-VN') : '';
const getAttempt = record => record?.latestAttempt || (record?.completedAt ? {
  lessonTitle: record.lesson?.title || 'Bài học', score: record.score || 0,
  correctCount: (record.answers || []).filter(a => a.correct).length,
  totalQuestions: (record.answers || []).length, completedAt: record.completedAt,
  answers: (record.answers || []).filter(a => a.question).map(a => ({
    questionText: a.question?.content || 'Câu hỏi đã lưu',
    correctAnswer: a.question?.answer, isCorrect: Boolean(a.correct)
  }))
} : null);

export default function MapPage({ navigate, user }) {
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('all');

  const studentGrade = user?.grade
    ? Number(user.grade)
    : Number(JSON.parse(localStorage.getItem('hoc-vui-user') || '{}').grade || 0);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [items, records, subList] = await Promise.all([
        api('/lessons'),
        api('/progress/me'),
        api(studentGrade ? `/subjects?grade=${studentGrade}` : '/subjects').catch(() => []),
      ]);
      setLessons(items);
      setProgress(records);
      setSubjects(Array.isArray(subList) ? subList : []);
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const latestAttemptRecord = progress.find(r => r.latestAttempt || r.completedAt);
  const latestAttempt = getAttempt(latestAttemptRecord);

  const applicableSubjects = studentGrade
    ? subjects.filter(s => !s.gradeLevels?.length || s.gradeLevels.includes(studentGrade))
    : subjects;

  const subjectMap = applicableSubjects.reduce((acc, s) => {
    acc[s.key] = s;
    return acc;
  }, {
    math: { name: 'Toán học', icon: '📐' },
    vietnamese: { name: 'Tiếng Việt', icon: '📖' },
  });

  const tabs = [
    { id: 'all', label: 'Tất cả bài học' },
    ...applicableSubjects.map(s => ({
      id: s.key,
      label: `${s.icon || '📚'} ${s.name}`,
    })),
  ];

  const filtered = subject === 'all' ? lessons : lessons.filter(l => l.subject === subject);

  return (
    <main className="student-main">
      <header className="map-title-bar asgn-hero">
        <div>
          <span className="eyebrow-sky">HÀNH TRÌNH TRI THỨC</span>
          <h1>Bản đồ khám phá bài học</h1>
          <p>Mỗi khóa học là một hành trình thú vị. Hãy lựa chọn bài học và bắt đầu ngay!</p>
        </div>
        <span className="map-star-pill">
          <Sparkles size={16} /> <span>H mỗi ngày</span>
        </span>
      </header>

      {/* Last attempt summary */}
      {latestAttempt && !loading && (
        <article className="map-last-attempt">
          <div className="map-last-icon-box">📝</div>
          <div className="map-last-body">
            <span className="map-last-label">LẦN LÀM BÀI GẦN NHẤT</span>
            <b>{latestAttempt.lessonTitle} · <span className="map-last-score">{latestAttempt.score}%</span></b>
            <p>Đúng {latestAttempt.correctCount}/{latestAttempt.totalQuestions} câu · {dateText(latestAttempt.completedAt)}</p>
          </div>
          <span className={`map-score-badge ${latestAttempt.score >= 80 ? 'great' : latestAttempt.score >= 50 ? 'ok' : 'low'}`}>
            {latestAttempt.score >= 80 ? '🌟 Xuất sắc' : latestAttempt.score >= 50 ? '👍 Rất tốt' : '💪 Cố lên nhé'}
          </span>
        </article>
      )}

      {/* Subject filter tabs */}
      <div className="map-filter-tabs">
        <Filter size={15} className="map-filter-icon" />
        {tabs.map(s => (
          <button
            key={s.id}
            className={`map-tab ${subject === s.id ? 'active' : ''}`}
            onClick={() => setSubject(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <section className="student-loading-grid" aria-label="Đang tải khóa học">
          {[0, 1, 2].map(i => <div className="student-skeleton-card" key={i}><i /><span /><b /><small /></div>)}
        </section>
      ) : error ? (
        <StudentEmptyState
          icon={<RefreshCw size={30} />}
          title="Chưa tải được hành trình"
          description="Kết nối đang gặp trục trặc. Thử tải lại để xem các bài học của bạn."
          action="Thử lại"
          onAction={load}
        />
      ) : (
        <section className="journey-roadmap">
          {filtered.length ? filtered.map((lesson, index) => {
            const record = progress.find(r => (r.lesson?._id || r.lesson) === lesson._id);
            const attempt = getAttempt(record);
            const total = lesson.questionCount || attempt?.totalQuestions || 0;
            const answered = attempt?.totalQuestions || record?.answers?.length || 0;
            const completed = Boolean(record?.completedAt || attempt);
            const score = attempt?.score ?? record?.score;
            const percent = completed ? Math.max(0, Math.min(100, Number(score ?? 100))) : total ? Math.round((answered / total) * 100) : 0;
            const correctCount = attempt?.correctCount ?? (record?.answers || []).filter(a => a.correct).length;
            const isNew = !record;
            const subMeta = subjectMap[lesson.subject] || { name: lesson.subject, icon: '📚' };

            return (
              <article className={`journey-lesson-card ${completed ? 'completed' : isNew ? 'new' : 'in-progress'}`} key={lesson._id}>
                <div className="jlc-icon sky">
                  {completed ? <CheckCircle2 size={26} className="jlc-done-icon" /> : isNew ? <BookOpen size={24} /> : subMeta.icon}
                </div>

                <div className="jlc-body">
                  <div className="jlc-meta">
                    <span className="jlc-subject">{subMeta.icon} {subMeta.name.toUpperCase()} · LỚP {lesson.grade}</span>
                    <span className={`jlc-status-chip ${completed ? 'done' : isNew ? 'new' : 'progress'}`}>
                      {completed ? '✓ Đã hoàn thành' : isNew ? 'Mới' : 'Đang học'}
                    </span>
                  </div>

                  <h3>{lesson.title}</h3>
                  <p>{lesson.description || 'Khám phá bài học mới và tự tin rèn luyện mỗi ngày.'}</p>

                  <div className="jlc-progress">
                    <ProgressBar value={percent} />
                    <small>{completed ? `Điểm số: ${percent}%` : answered ? `${answered}/${total} câu (${percent}%)` : 'Chưa bắt đầu'}</small>
                  </div>

                  {attempt && (
                    <small className="jlc-attempt-meta">
                      Lần làm gần nhất: đúng {correctCount}/{attempt.totalQuestions} câu · {dateText(attempt.completedAt)}
                    </small>
                  )}
                </div>

                <button
                  className={`jlc-action ${completed ? 'outline' : 'primary-sky'}`}
                  onClick={() => {
                    sessionStorage.setItem('hoc-vui-lesson', lesson._id);
                    navigate('lesson');
                  }}
                >
                  <span>{completed ? 'Học lại' : isNew ? 'Bắt đầu' : 'Tiếp tục'}</span>
                  <ChevronRight size={16} />
                </button>
              </article>
            );
          }) : (
            <div className="lesson-map-empty">
              <StudentEmptyState
                icon={<BookOpen size={31} />}
                title="Bản đồ đang chờ bài học mới"
                description="Hiện chưa có bài học cho lớp của bạn. Hãy quay lại sau nhé!"
              />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
