import { Bell, CloudCog, Coins, Flame, Zap, Menu } from 'lucide-react';
import Brand from './Brand';

export default function TopBar({ student = false, user, stats, navigate, onToggleMenu }) {
  const initials = (user?.name || 'HV').split(/\s+/).map(part => part[0]).slice(-2).join('').toUpperCase();
  
  let userName = null;
  try {
    userName = JSON.parse(localStorage.getItem('hoc-vui-user') || 'null');
  } catch {
    userName = null;
  }

  if (student) {
    return (
      <header className="student-head">
        <div className="student-head-brand-mobile" onClick={() => navigate?.('home')} role="button" tabIndex={0}>
          <span className="logo-mini">🎓</span>
          <b>H</b>
        </div>

        <div className="student-stats-bar">
          <button
            type="button"
            className="stat-pill streak-pill"
            title="Chuỗi ngày học liên tục. Bấm để xem điểm danh!"
            onClick={() => navigate?.('attendance')}
          >
            <span className="pill-icon flame-icon"><Flame size={15} /></span>
            <b className="pill-val">{stats?.streak ?? 0}</b>
            <span className="pill-label">ngày</span>
          </button>

          <button
            type="button"
            className="stat-pill coin-pill"
            title="Số xu tích lũy được. Bấm để xem thành tích!"
            onClick={() => navigate?.('award')}
          >
            <span className="pill-icon coin-icon"><Coins size={15} /></span>
            <b className="pill-val">{stats?.coins ?? 0}</b>
            <span className="pill-label">xu</span>
          </button>

          <button
            type="button"
            className="stat-pill xp-pill"
            title={`Cấp độ ${stats?.currentLevel ?? 1}: ${stats?.levelTitle || 'Học sinh'}`}
            onClick={() => navigate?.('award')}
          >
            <span className="pill-icon xp-icon"><Zap size={15} /></span>
            <b className="pill-val">Lv.{stats?.currentLevel ?? 1}</b>
            <span className="pill-label">{stats?.totalXP ?? 0} XP</span>
          </button>
        </div>

        <div className="student-user-badge" onClick={() => navigate?.('profile')} title="Xem trang cá nhân" role="button" tabIndex={0}>
          <div className="student-user-info">
            <span className="student-user-name">{user?.name || 'Học sinh'}</span>
            <span className="student-user-grade">Lớp {user?.grade || '—'}</span>
          </div>
          <button type="button" className="student-avatar" aria-label="Trang cá nhân">
            {initials}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="workspace-mobile-menu-btn"
          onClick={onToggleMenu}
          aria-label="Mở menu điều hướng"
        >
          <Menu size={21} />
        </button>
        <div className="workspace-mobile-brand">
          <Brand />
        </div>
      </div>
      <div className="head-actions">
        <span className="user-greeting">Xin chào, <b>{userName?.name || user?.name || 'Thầy/Cô/Admin'}</b></span>
      </div>
    </header>
  );
}
