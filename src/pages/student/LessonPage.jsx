import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Check, BookOpen, RefreshCw, BookX, Zap, Coins, Sparkles } from 'lucide-react';
import Modal from '../../components/Modal';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';
import StudentEmptyState from '../../components/StudentEmptyState';
import Helmet from '../../components/Helmet';

const stable = v => Array.isArray(v) ? JSON.stringify(v) : v && typeof v === 'object' ? JSON.stringify(Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))) : String(v ?? '').trim().toLowerCase();
const isCorrect = (q, v) => stable(v) === stable(q.answer);
const hasResponse = (q, v) => q.type === 'drag_drop' ? Array.isArray(v) && v.length === q.options.length : q.type === 'matching' ? v && typeof v === 'object' && q.options.every(p => { const [l] = p.split('|'); return Boolean(v[l]); }) : v !== undefined && String(v).trim() !== '';
const KEYS = ['A', 'B', 'C', 'D'];

export default function LessonPage({ navigate }) {
  const [lesson, setLesson] = useState(null), [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}), [index, setIndex] = useState(0);
  const [done, setDone] = useState(false), [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false), [loadError, setLoadError] = useState('');

  const load = async () => {
    const id = sessionStorage.getItem('hoc-vui-lesson');
    setLoading(true); setLoadError('');
    if (!id) { setLoadError('missing'); setLoading(false); return; }
    try {
      const data = await api(`/lessons/${id}/questions`);
      setLesson(data.lesson); setQuestions(data.questions || []);
    } catch (e) { setLoadError(e.message); toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const question = questions[index];
  const next = async () => {
    if (index < questions.length - 1) { setIndex(index + 1); return; }
    setSubmitting(true);
    const results = questions.map(q => ({ question: q._id, response: answers[q._id] }));
    const score = Math.round(questions.filter(q => isCorrect(q, answers[q._id])).length / questions.length * 100);
    try {
      await api(`/progress/lesson/${lesson._id}`, { method: 'PUT', body: JSON.stringify({ score, completedAt: new Date().toISOString(), answers: results }) });
      setDone(true); toast.success('Đã hoàn thành và lưu kết quả bài học!');
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <main className="quiz-page student-quiz-state">
      <div className="student-skeleton-hero" />
      <div className="student-skeleton-card" />
    </main>
  );

  if (loadError) return (
    <main className="quiz-page student-quiz-state">
      <StudentEmptyState
        icon={loadError === 'missing' ? <BookX size={31} /> : <RefreshCw size={30} />}
        title={loadError === 'missing' ? 'Chưa chọn bài học' : 'Bài học chưa thể mở'}
        description={loadError === 'missing' ? 'Hãy quay lại bản đồ bài học và chọn một chủ đề để bắt đầu.' : 'Bài học có thể đã tạm khóa hoặc kết nối mạng bị gián đoạn. Quay lại bản đồ để chọn bài khác nhé.'}
        action="Về bản đồ khám phá"
        onAction={() => navigate('map')}
      />
    </main>
  );

  if (!question) return (
    <main className="quiz-page student-quiz-state">
      <StudentEmptyState
        icon={<BookOpen size={31} />}
        title="Bài học đang được chuẩn bị"
        description="Bài học này hiện chưa có câu hỏi thực hành. Bạn hãy quay lại khám phá bài khác nhé!"
        action="Chọn bài học khác"
        onAction={() => navigate('map')}
      />
    </main>
  );

  const selected = answers[question._id];
  const saveAnswer = v => setAnswers(prev => ({ ...prev, [question._id]: v }));
  const showOptions = question.type === 'multiple_choice' && question.options?.length;
  const correctCount = questions.filter(q => isCorrect(q, answers[q._id])).length;
  const progressPct = ((index + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <main className="quiz-page">
      <Helmet title={lesson?.title ? `${lesson.title} - Luyện tập bài học` : 'Làm bài học'} />

      {/* Header */}
      <header className="qz-head">
        <button className="qz-exit-btn" onClick={() => navigate('map')}>
          <ChevronLeft size={18} /> <span>Thoát</span>
        </button>
        <div className="qz-head-center">
          <b>{lesson?.title}</b>
          <div className="qz-prog-bar-wrap">
            <div className="qz-prog-bar"><i style={{ width: `${progressPct}%` }} /></div>
            <span className="qz-prog-label">{index + 1}/{questions.length}</span>
          </div>
        </div>
        <span className="qz-hearts">
          <Heart size={18} fill="#ef4444" color="#ef4444" /> <span>3</span>
        </span>
      </header>

      <section className="qz-layout">
        {/* Sidebar */}
        <aside className="qz-sidebar">
          <div className="qz-sidebar-title">
            <BookOpen size={16} />
            <div>
              <b>Danh sách câu hỏi</b>
              <small>{answeredCount}/{questions.length} đã trả lời</small>
            </div>
          </div>
          <div className="qz-number-grid">
            {questions.map((q, i) => (
              <button
                key={q._id}
                className={`qz-num-btn ${index === i ? 'active' : answers[q._id] !== undefined ? 'done' : ''}`}
                onClick={() => setIndex(i)}
              >
                {answers[q._id] !== undefined ? <Check size={13} /> : i + 1}
              </button>
            ))}
          </div>
          <p className="qz-legend">
            <span className="qz-legend-item"><i className="qz-dot answered" /> Đã làm</span>
            <span className="qz-legend-item"><i className="qz-dot current" /> Đang làm</span>
          </p>
        </aside>

        {/* Main question card */}
        <section className="qz-card">
          <div className="qz-card-top">
            <span className="qz-card-label">CÂU HỎI {index + 1}</span>
            <div className="qz-card-bar"><i style={{ width: `${progressPct}%` }} /></div>
          </div>

          <div className="qz-mascot">
            <span>✨</span>
            <p>Đọc kỹ câu hỏi và chọn câu trả lời chính xác nhất nhé!</p>
          </div>

          <h1 className="qz-question">{question.content}</h1>

          {showOptions ? (
            <div className="qz-options">
              {question.options.map((opt, i) => (
                <button
                  key={`${opt}-${i}`}
                  className={`qz-option ${selected === opt ? 'selected' : ''}`}
                  onClick={() => saveAnswer(opt)}
                >
                  <span className="qz-opt-key">{KEYS[i] || i + 1}</span>
                  <span className="qz-opt-text">{opt}</span>
                </button>
              ))}
            </div>
          ) : question.type === 'drag_drop' ? (
            <div className="qz-options">
              <p className="qz-hint">Nhấp chọn từng thẻ theo đúng thứ tự. Thứ tự hiện tại: {(selected || []).join(' → ') || 'chưa chọn'}</p>
              {question.options.map((opt, i) => (
                <button
                  key={`${opt}-${i}`}
                  className={`qz-option ${(selected || []).includes(opt) ? 'selected' : ''}`}
                  onClick={() => saveAnswer((selected || []).includes(opt) ? selected.filter(x => x !== opt) : [...(selected || []), opt])}
                >
                  <span className="qz-opt-key">{(selected || []).indexOf(opt) >= 0 ? (selected || []).indexOf(opt) + 1 : i + 1}</span>
                  <span className="qz-opt-text">{opt}</span>
                </button>
              ))}
              <button className="outline qz-clear-btn" onClick={() => saveAnswer((selected || []).slice(0, -1))}>
                Bỏ lựa chọn gần nhất
              </button>
            </div>
          ) : question.type === 'matching' ? (
            <div className="qz-matching">
              {question.options.map(pair => {
                const [left, ...rParts] = pair.split('|'), right = rParts.join('|');
                return (
                  <label key={pair} className="qz-match-row">
                    <span>{left}</span>
                    <select value={selected?.[left] || ''} onChange={e => saveAnswer({ ...selected, [left]: e.target.value })}>
                      <option value="">-- Chọn đáp án phù hợp --</option>
                      {question.options.map(item => (
                        <option key={item} value={item.split('|').slice(1).join('|')}>
                          {item.split('|').slice(1).join('|')}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          ) : (
            <label className="qz-input-label">
              <span>Đáp án của bạn:</span>
              <input value={selected ?? ''} onChange={e => saveAnswer(e.target.value)} placeholder="Nhập câu trả lời chính xác vào đây" autoComplete="off" />
            </label>
          )}

          <footer className="qz-footer">
            <button className="outline qz-prev-btn" disabled={!index || submitting} onClick={() => setIndex(index - 1)}>
              <ChevronLeft size={17} /> <span>Câu trước</span>
            </button>
            <button className="qz-next-btn" disabled={!hasResponse(question, selected) || submitting} onClick={next}>
              <span>{submitting ? 'Đang chấm điểm...' : index === questions.length - 1 ? '🚀 Nộp bài & Xem điểm' : 'Câu tiếp theo'}</span>
              {!submitting && <ChevronRight size={17} />}
            </button>
          </footer>
        </section>
      </section>

      {/* Completion modal */}
      {done && (
        <Modal title="Chúc mừng bạn đã hoàn thành bài học! 🎉" onClose={() => navigate('map')}>
          <div className="qz-result-summary">
            <div className="qz-result-score">{Math.round((correctCount / questions.length) * 100)}%</div>
            <p>Bạn đã trả lời đúng <b>{correctCount}/{questions.length}</b> câu hỏi</p>
            <div className="qz-reward-row">
              <span className="qz-reward-item xp"><Zap size={16} /> +{correctCount * 10 + 50} XP</span>
              <span className="qz-reward-item coin"><Coins size={16} /> +10 Xu</span>
            </div>
          </div>
          <div className="answer-review">
            {questions.map((q, i) => (
              <p key={q._id}>
                <b>{i + 1}. {q.content}</b>
                <span style={{ color: isCorrect(q, answers[q._id]) ? '#0284c7' : '#ef4444' }}>
                  {isCorrect(q, answers[q._id]) ? '✓ Trả lời đúng' : '✗ Chưa chính xác'} · Đáp án đúng: {typeof q.answer === 'object' ? JSON.stringify(q.answer) : q.answer}
                </span>
              </p>
            ))}
          </div>
          <button className="primary-sky full" onClick={() => navigate('map')}>
            <span>Quay lại bản đồ khám phá</span>
          </button>
        </Modal>
      )}
    </main>
  );
}
