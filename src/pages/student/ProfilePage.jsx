import { useEffect, useState } from 'react';
import { KeyRound, Save, UserRound, Mail, BookMarked, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';

export default function ProfilePage({ user, onUpdate }) {
  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/users/me')
      .then(data => {
        setProfile(data);
        setName(data.name || '');
      })
      .catch(e => toast.error(e.message));
  }, []);

  const saveName = async () => {
    setBusy(true);
    try {
      const updated = await api('/users/me', { method: 'PATCH', body: JSON.stringify({ name }) });
      setProfile(updated);
      onUpdate(updated);
      toast.success('Đã cập nhật thông tin cá nhân thành công.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async event => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới nhập lại chưa khớp.');
      return;
    }
    setBusy(true);
    try {
      const result = await api('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      toast.success(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const initials = (profile.name || 'HV').split(/\s+/).map(p => p[0]).slice(-2).join('').toUpperCase();

  return (
    <main className="student-main">
      {/* Identity Card */}
      <section className="prof-identity-card">
        <div className="prof-avatar-large">{initials}</div>
        <div className="prof-identity-info">
          <span className="eyebrow-sky">TÀI KHOẢN HỌC SINH</span>
          <h1>{profile.name || 'Học sinh'}</h1>
          <div className="prof-meta-row">
            <span className="prof-meta-chip"><Mail size={13} /> {profile.email || 'Chưa cập nhật'}</span>
            <span className="prof-meta-chip grade"><BookMarked size={13} /> Lớp {profile.grade || '—'}</span>
            <span className="prof-meta-chip badge"><Sparkles size={13} /> Thành viên tích cực</span>
          </div>
        </div>
      </section>

      <div className="prof-grid">
        {/* Personal info */}
        <article className="panel prof-panel">
          <div className="prof-panel-header">
            <UserRound size={19} />
            <h2>Thông tin tài khoản</h2>
          </div>
          <p className="prof-hint">Địa chỉ email và lớp học do nhà trường hoặc quản trị viên quản trị.</p>

          <div className="form">
            <label>
              Họ và tên học sinh
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nhập họ và tên của bạn" />
            </label>
            <label>
              Địa chỉ Email
              <input value={profile.email || ''} readOnly className="input-readonly" />
            </label>
            <label>
              Khối lớp học
              <input value={profile.grade ? `Lớp ${profile.grade}` : 'Chưa cập nhật'} readOnly className="input-readonly" />
            </label>
            <button className="primary-sky" disabled={busy || !name.trim()} onClick={saveName}>
              <Save size={16} /> <span>Lưu thông tin</span>
            </button>
          </div>
        </article>

        {/* Change password */}
        <form className="panel prof-panel" onSubmit={changePassword}>
          <div className="prof-panel-header">
            <KeyRound size={19} />
            <h2>Đổi mật khẩu bảo vệ</h2>
          </div>
          <p className="prof-hint">Mật khẩu mới cần có độ dài tối thiểu từ 6 ký tự trở lên.</p>

          <div className="form">
            <label>
              Mật khẩu hiện tại
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu cũ"
                required
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                required
              />
            </label>
            <label>
              Nhập lại mật khẩu mới
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại chính xác mật khẩu mới"
                required
              />
            </label>
            <button className="primary-sky" disabled={busy}>
              <KeyRound size={16} /> <span>Cập nhật mật khẩu mới</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
