import { Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmModal';

const labels = { student: 'Học sinh', teacher: 'Giáo viên', admin: 'Quản trị viên' };
const blankForm = () => ({ name: '', email: '', password: '123123', role: 'student', grade: '1' });
const initials = name =>
  (name || '')
    .split(' ')
    .map(part => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();

const dateLabel = value =>
  value
    ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem('hoc-vui-user') || 'null');
} catch {
  currentUser = null;
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [form, setForm] = useState(blankForm);

  const load = async () => {
    try {
      setUsers(await api('/users?limit=1000'));
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.role === 'student' ? { grade: String(form.grade || '1') } : {}),
      };
      await api('/users', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Đã tạo tài khoản thành công.');
      setOpen(false);
      setForm(blankForm());
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const beginEdit = user => {
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      grade: user.role === 'student' ? String(user.grade || '1') : '',
    });
    setEditing(user);
  };

  const saveEdit = async () => {
    const gradeChanged =
      editing.role === 'student' && form.role === 'student' && String(editing.grade) !== String(form.grade);
    if (gradeChanged) {
      const confirmed = await confirm({
        title: 'Cảnh báo đổi khối lớp',
        message:
          'Đổi lớp sẽ làm lại các thành tích bài học (Bước đầu tiên, Ham học hỏi, Trả lời chính xác, Điểm tuyệt đối) theo khối lớp mới, đồng thời giữ nguyên Cấp độ, Số ngày điểm danh và Xu tích lũy của học sinh. Bạn có chắc chắn muốn tiếp tục?',
        confirmText: 'Đồng ý đổi lớp',
        type: 'danger',
      });
      if (!confirmed) return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        grade: form.role === 'student' ? String(form.grade || '1') : null,
      };
      const updated = await api(`/users/${editing._id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast.success(
        updated.learningDataReset
          ? 'Đã đổi khối lớp (đã giữ nguyên cấp độ, số ngày điểm danh và xu).'
          : 'Đã cập nhật người dùng.'
      );
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const toggle = async user => {
    setBusyId(user._id);
    try {
      const updated = await api(`/users/${user._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !user.active }),
      });
      setUsers(current =>
        current.map(item => (item._id === user._id ? { ...item, ...updated } : item))
      );
      toast.success(updated.active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId('');
    }
  };

  const deleteUser = async user => {
    const isSelf = user._id === (currentUser?.id || currentUser?._id) || user.email === currentUser?.email;
    if (isSelf) {
      toast.error('Bạn không thể xóa tài khoản quản trị của chính mình.');
      return;
    }
    const roleName = labels[user.role] || user.role;
    const ok = await confirm({
      title: `Xóa ${roleName.toLowerCase()} "${user.name}"?`,
      message: `Tài khoản "${user.email}" cùng toàn bộ dữ liệu học tập/giảng dạy liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn có chắc chắn muốn xóa?`,
      confirmText: 'Xóa tài khoản',
      type: 'danger',
    });
    if (!ok) return;

    setBusyId(user._id);
    try {
      await api(`/users/${user._id}`, { method: 'DELETE' });
      toast.success(`Đã xóa tài khoản "${user.name}" thành công.`);
      setUsers(current => current.filter(item => item._id !== user._id));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId('');
    }
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const columns = [
    {
      key: 'name',
      label: 'Người dùng',
      render: user => (
        <>
          <span className="table-avatar">{initials(user.name)}</span>
          {user.name}
        </>
      ),
    },
    {
      key: 'role',
      label: 'Vai trò',
      render: user => labels[user.role] || user.role,
    },
    { key: 'email', label: 'Email' },
    {
      key: 'grade',
      label: 'Khối lớp',
      render: user => (user.role === 'student' && user.grade ? `Lớp ${user.grade}` : '—'),
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: user => dateLabel(user.createdAt),
      sortValue: user => new Date(user.createdAt || 0).getTime(),
    },
    {
      key: 'active',
      label: 'Trạng thái',
      render: user => (
        <span className={'status ' + (user.active ? 'ok' : 'warning')}>
          {user.active ? 'Hoạt động' : 'Tạm khóa'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      sortable: false,
      render: user => {
        const isSelf = user._id === (currentUser?.id || currentUser?._id) || user.email === currentUser?.email;
        return (
          <div className="table-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button className="outline" onClick={() => beginEdit(user)} title="Chỉnh sửa thông tin">
              <Pencil size={14} /> Sửa
            </button>
            <button
              className="outline"
              disabled={busyId === user._id || isSelf}
              onClick={() => toggle(user)}
              title={isSelf ? 'Không thể khóa tài khoản đang đăng nhập' : user.active ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
              style={{
                color: user.active ? '#d97706' : '#10b981',
                borderColor: user.active ? '#fde68a' : '#a7f3d0',
                background: user.active ? '#fffbeb' : '#ecfdf5',
              }}
            >
              {busyId === user._id ? 'Đang lưu...' : user.active ? 'Khóa' : 'Mở khóa'}
            </button>
            <button
              className="icon-button"
              disabled={busyId === user._id || isSelf}
              onClick={() => deleteUser(user)}
              title={isSelf ? 'Không thể xóa tài khoản bạn đang đăng nhập' : 'Xóa vĩnh viễn người dùng'}
              style={{
                color: isSelf ? '#cbd5e1' : '#ef4444',
                borderColor: isSelf ? '#e2e8f0' : '#fee2e2',
                background: isSelf ? '#f8fafc' : '#fef2f2',
                cursor: isSelf ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  const formFields = (
    <>
      <label>
        Họ và tên <span style={{ color: '#ef4444' }}>*</span>
        <input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="VD: Nguyễn Văn A"
          required
        />
      </label>

      <label>
        Email đăng nhập <span style={{ color: '#ef4444' }}>*</span>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="VD: user@hocvui.vn"
          required
        />
      </label>

      <label>
        Vai trò <span style={{ color: '#ef4444' }}>*</span>
        <select
          value={form.role}
          onChange={e => {
            const newRole = e.target.value;
            setForm(prev => ({
              ...prev,
              role: newRole,
              grade: newRole === 'student' ? prev.grade || '1' : '',
            }));
          }}
        >
          {Object.entries(labels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {form.role === 'student' && (
        <label>
          Khối lớp <span style={{ color: '#ef4444' }}>*</span>
          <select
            value={form.grade}
            onChange={e => setForm({ ...form, grade: e.target.value })}
          >
            {[1, 2, 3, 4, 5].map(value => (
              <option key={value} value={String(value)}>
                Lớp {value}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );

  return (
    <main className="dashboard role-admin">
      <header className="page-heading">
        <div>
          <span className="role-kicker">QUẢN TRỊ NGƯỜI DÙNG</span>
          <h1>Quản lý người dùng</h1>
          <p>Tạo tài khoản, cập nhật thông tin, phân quyền và quản lý trạng thái đăng nhập.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setForm(blankForm());
            setOpen(true);
          }}
        >
          <Plus size={18} /> Thêm người dùng
        </button>
      </header>

      <section className="panel">
        <DataTable
          rows={users}
          columns={columns}
          searchKeys={['name', 'email']}
          searchPlaceholder="Tìm theo tên hoặc email"
          filters={[
            {
              key: 'role',
              label: 'Vai trò',
              options: Object.entries(labels).map(([value, label]) => ({ value, label })),
            },
            {
              key: 'grade',
              label: 'Khối lớp',
              options: [1, 2, 3, 4, 5].map(value => ({ value: String(value), label: `Lớp ${value}` })),
            },
            {
              key: 'active',
              label: 'Trạng thái',
              options: [
                { value: 'true', label: 'Hoạt động' },
                { value: 'false', label: 'Tạm khóa' },
              ],
            },
          ]}
          emptyText="Không tìm thấy người dùng phù hợp."
          initialSort={{ key: 'createdAt', direction: -1 }}
        />
      </section>

      {(open || editing) && (
        <Modal
          className="modal-md"
          title={editing ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}
          onClose={closeModal}
        >
          <div className="form" style={{ gap: '14px' }}>
            {formFields}
            {editing ? (
              <div className="modal-actions" style={{ marginTop: '12px' }}>
                <button type="button" className="outline" onClick={closeModal}>
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={!form.name.trim() || !form.email}
                  onClick={saveEdit}
                >
                  <Pencil size={15} /> Lưu thay đổi
                </button>
              </div>
            ) : (
              <>
                <label>
                  Mật khẩu khởi tạo <span style={{ color: '#ef4444' }}>*</span>
                  <input
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                  />
                </label>
                <div className="modal-actions" style={{ marginTop: '12px' }}>
                  <button type="button" className="outline" onClick={closeModal}>
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={!form.name.trim() || !form.email || !form.password}
                    onClick={create}
                  >
                    <UserPlus size={16} /> Tạo tài khoản
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}
