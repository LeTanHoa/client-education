import { useEffect, useState } from 'react';
import { CalendarCheck, Flame, Star, RefreshCw, CalendarDays, Coins, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';
import StudentEmptyState from '../../components/StudentEmptyState';

const displayDate = key => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
const DAY_ABBR = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function AttendancePage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setData(await api('/attendance/me')); }
    catch (e) { setError(e.message); toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const checkIn = async () => {
    setBusy(true);
    try {
      const result = await api('/attendance/check-in', { method: 'POST' });
      toast.success(result.alreadyCheckedIn ? 'Bạn đã điểm danh hôm nay rồi!' : '🎉 Điểm danh thành công! +5 xu +20 XP');
      await load();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  // Build last 7 days tracker
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const checked = data?.records?.some(r => r.dateKey === key);
    const isToday = i === 6;
    return { key, dayLabel: DAY_ABBR[d.getDay()], dayNum: d.getDate(), checked, isToday };
  });

  if (loading) return (
    <main className="student-main">
      <div className="student-skeleton-hero" />
      <div className="student-loading-grid attendance-loading">
        <div className="student-skeleton-card" />
        <div className="student-skeleton-card" />
      </div>
    </main>
  );

  if (error) return (
    <main className="student-main">
      <StudentEmptyState
        icon={<RefreshCw size={30} />}
        title="Chưa tải được lịch điểm danh"
        description="Thử tải lại để xem chuỗi ngày học của bạn."
        action="Thử lại"
        onAction={load}
      />
    </main>
  );

  return (
    <main className="student-main">
      <header className="map-title-bar asgn-hero">
        <div className=''>
          <span className="eyebrow-sky">THÓI QUEN HỌC TẬP TÍCH CỰC</span>
          <h1>Điểm danh &amp; Chuỗi ngày học</h1>
          <p>Duy trì thói quen học tập mỗi ngày để thắp sáng ngọn lửa tri thức và nhận phần thưởng hấp dẫn!</p>
        </div>
        <span className="map-star-pill">
          <Sparkles size={16} /> <span>Học đều mỗi ngày</span>
        </span>
      </header>

      {/* Streak Showcase */}
      <section className="att-hero">
        <div className="att-flame-section">
          <div className={`att-flame-badge ${data?.streak > 0 ? 'active' : ''}`}>
            🔥
          </div>
          <div className="att-streak-info">
            <b className="att-streak-num">{data?.streak ?? 0}</b>
            <span className="att-streak-label">ngày học liên tiếp</span>
          </div>
          {(data?.streak ?? 0) >= 3 && (
            <span className="att-streak-msg">🌟 Phong độ tuyệt vời! Tiếp tục phát huy nhé!</span>
          )}
        </div>

        {/* 7-Day Tracker */}
        <div className="att-week-track">
          {last7.map(day => (
            <div key={day.key} className={`att-day ${day.checked ? 'checked' : ''} ${day.isToday ? 'today' : ''}`}>
              <span className="att-day-name">{day.dayLabel}</span>
              <span className="att-day-num">{day.dayNum}</span>
              {day.checked ? (
                <span className="att-check-mark">✓</span>
              ) : (
                <span className="att-day-dot" />
              )}
            </div>
          ))}
        </div>

        {/* Check-in Action */}
        <div className="att-checkin-section">
          <button
            className={`att-checkin-btn ${data?.checkedInToday ? 'done' : ''}`}
            disabled={!data || data.checkedInToday || busy}
            onClick={checkIn}
          >
            {data?.checkedInToday ? (
              <>
                <CheckCircle2 size={22} />
                <span>Đã điểm danh hôm nay!</span>
              </>
            ) : busy ? (
              <span>Đang ghi nhận...</span>
            ) : (
              <>
                <CalendarCheck size={22} />
                <span>Điểm danh ngay hôm nay</span>
              </>
            )}
          </button>
          {!data?.checkedInToday && (
            <p className="att-reward-hint">✨ Nhận ngay +5 xu &amp; +20 XP khi điểm danh hôm nay</p>
          )}
        </div>
      </section>

      {/* Stats Row */}
      <section className="att-stats-row">
        <div className="att-stat">
          <span className="att-stat-icon flame"><Flame size={22} /></span>
          <div>
            <b>{data?.streak ?? '—'} ngày</b>
            <small>Chuỗi ngày liên tiếp</small>
          </div>
        </div>
        <div className="att-stat">
          <span className="att-stat-icon star"><Star size={22} /></span>
          <div>
            <b>{data?.totalDays ?? '—'} ngày</b>
            <small>Tổng ngày điểm danh</small>
          </div>
        </div>
        <div className="att-stat">
          <span className="att-stat-icon coin"><Coins size={22} /></span>
          <div>
            <b>{(data?.totalDays ?? 0) * 5} xu</b>
            <small>Kho xu từ điểm danh</small>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="att-history panel">
        <h2>
          <CalendarDays size={18} />
          <span>Lịch sử điểm danh gần đây</span>
        </h2>
        {data?.records?.length ? (
          <div className="att-history-list">
            {[...data.records].reverse().map(item => (
              <div key={item._id} className="att-history-row">
                <span className="att-history-icon"><CalendarCheck size={16} /></span>
                <b>{displayDate(item.dateKey)}</b>
                <span className="att-history-status">Đã ghi nhận điểm danh ✓</span>
              </div>
            ))}
          </div>
        ) : (
          <StudentEmptyState
            compact
            icon={<CalendarDays size={28} />}
            title="Lịch điểm danh còn trống"
            description="Hãy bấm điểm danh hôm nay để ghi dấu ngày học đầu tiên trong chuỗi hành trình nhé."
          />
        )}
      </section>
    </main>
  );
}
