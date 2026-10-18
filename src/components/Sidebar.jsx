import {
  Home, Map, Trophy, CalendarCheck, UserRound, BookOpen, FileQuestion,
  ClipboardList, BarChart3, Settings, Users, ShieldCheck, LogOut,
  MessageSquare, GraduationCap, X
} from 'lucide-react';
import Brand from './Brand';

const icons = {
  home: Home, map: Map, award: Trophy, attendance: CalendarCheck, profile: UserRound,
  lessons: BookOpen, questions: FileQuestion, assignments: ClipboardList, progress: BarChart3,
  settings: Settings, users: Users, content: BookOpen, system: ShieldCheck, feedback: MessageSquare,
  subjects: GraduationCap
};

const student = [
  ['home',        'Trang chủ'],
  ['map',         'Khám phá'],
  ['assignments', 'Bài tập'],
  ['attendance',  'Điểm danh'],
  ['award',       'Thành tích'],
  ['profile',     'Cá nhân'],
];

const teacher = [
  ['home',        'Tổng quan'],
  ['lessons',     'Bài học'],
  ['questions',   'Câu hỏi'],
  ['assignments', 'Giao bài'],
  ['progress',    'Điểm số'],
];

const admin = [
  ['home',     'Tổng quan'],
  ['users',    'Người dùng'],
  ['subjects', 'Môn học'],
  ['content',  'Duyệt nội dung'],
  ['feedback', 'Phản hồi'],
  ['system',   'Hệ thống'],
  ['settings', 'Cài đặt'],
];

const workspace = [
  ['home',        'Tổng quan'],
  ['progress',    'Tiến độ'],
  ['assignments', 'Bài tập'],
  ['settings',    'Cài đặt'],
];

export default function Sidebar({
  role = 'student',
  active = 'home',
  navigate,
  onLogout,
  mobileOpen = false,
  onCloseMobile
}) {
  const list = role === 'student' ? student : role === 'teacher' ? teacher : role === 'admin' ? admin : workspace;
  const isStudent = role === 'student';

  const handleNavClick = id => {
    navigate?.(id);
    onCloseMobile?.();
  };

  const handleLogoutClick = () => {
    onLogout?.();
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile backdrop for workspace drawer */}
      {!isStudent && mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside className={`sidebar ${role} ${!isStudent && mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-head-row">
          <Brand />
          {!isStudent && (
            <button
              type="button"
              className="sidebar-mobile-close"
              onClick={onCloseMobile}
              aria-label="Đóng menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav>
          {list.map(([id, label]) => {
            const I = icons[id];
            const isActive = active === id;
            return (
              <button
                key={id}
                className={isActive ? 'selected' : ''}
                onClick={() => handleNavClick(id)}
                title={label}
              >
                <I size={isStudent ? 22 : 20} />
                <span>{label}</span>
                {isStudent && isActive && <span className="nav-active-dot" />}
              </button>
            );
          })}
        </nav>

        <button className="logout" onClick={handleLogoutClick}>
          <LogOut size={19} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      {/* Student Fixed Bottom Navigation for Mobile */}
      {isStudent && (
        <nav className="student-bottom-nav" aria-label="Điều hướng chính mobile">
          {student.map(([id, label]) => {
            const I = icons[id];
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                className={`student-bottom-tab ${isActive ? 'active' : ''}`}
                onClick={() => navigate?.(id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <I size={21} />
                <span>{label}</span>
                {isActive && <span className="student-bottom-pill" />}
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
