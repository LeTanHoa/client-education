import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, GraduationCap, CheckCircle2, PauseCircle, BookOpen, Layers } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatCard from '../../components/StatCard';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmModal';

const EMOJI_PRESETS = ['📐', '📖', '🌍', '🔬', '💻', '🎨', '🎵', '🏃', '⭐', '🧩', '🌱', '🚀'];
const COLOR_OPTIONS = [
  { value: 'sky', label: 'Xanh da trời (Sky)', class: 'blue' },
  { value: 'orange', label: 'Cam ấm (Orange)', class: 'orange' },
  { value: 'emerald', label: 'Xanh lá (Emerald)', class: 'mint' },
  { value: 'purple', label: 'Tím mộng mơ (Purple)', class: 'purple' },
  { value: 'rose', label: 'Hồng san hô (Rose)', class: 'rose' },
  { value: 'teal', label: 'Xanh ngọc (Teal)', class: 'mint' },
];

const emptyForm = {
  name: '',
  key: '',
  description: '',
  icon: '📚',
  color: 'sky',
  gradeLevels: [1, 2, 3, 4, 5],
  order: 1,
  status: 'active',
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/subjects?all=true');
      setSubjects(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      order: (subjects.length || 0) + 1,
    });
    setOpen(true);
  };

  const openEdit = item => {
    setEditingId(item._id);
    const itemGrades = Array.isArray(item.gradeLevels) && item.gradeLevels.length
      ? [...item.gradeLevels].map(Number).sort((a, b) => a - b)
      : [1, 2, 3, 4, 5];
    setForm({
      name: item.name || '',
      key: item.key || '',
      description: item.description || '',
      icon: item.icon || '📚',
      color: item.color || 'sky',
      gradeLevels: itemGrades,
      order: typeof item.order === 'number' ? item.order : 1,
      status: item.status || 'active',
    });
    setOpen(true);
  };

  const handleNameChange = val => {
    if (!editingId && (!form.key || form.key === slugify(form.name))) {
      setForm(prev => ({
        ...prev,
        name: val,
        key: slugify(val),
      }));
    } else {
      setForm(prev => ({ ...prev, name: val }));
    }
  };

  const slugify = text => {
    return (text || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const toggleGrade = g => {
    setForm(prev => {
      const cur = prev.gradeLevels || [];
      const next = cur.includes(g) ? cur.filter(x => x !== g) : [...cur, g];
      next.sort((a, b) => a - b);
      return { ...prev, gradeLevels: next.length ? next : [g] };
    });
  };

  const save = async e => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên môn học.');
      return;
    }
    if (!form.key.trim()) {
      toast.error('Vui lòng nhập mã môn học (key).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api(`/subjects/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
        toast.success(`Đã cập nhật môn học "${form.name}".`);
      } else {
        await api('/subjects', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toast.success(`Đã thêm môn học "${form.name}".`);
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const removeSubject = async item => {
    const ok = await confirm({
      title: 'Xóa môn học',
      message: `Bạn có chắc muốn xóa môn học "${item.name}" (Mã: ${item.key})? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa môn học',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await api(`/subjects/${item._id}`, { method: 'DELETE' });
      toast.success(`Đã xóa môn học "${item.name}".`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const activeCount = subjects.filter(s => s.status === 'active').length;
  const totalLessons = subjects.reduce((sum, s) => sum + (s.lessonsCount || 0), 0);

  const columns = [
    {
      key: 'name',
      label: 'Môn học',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '24px',
              width: '42px',
              height: '42px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: '12px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
            }}
          >
            {item.icon || '📚'}
          </span>
          <div>
            <b style={{ fontSize: '14px', color: '#0f172a' }}>{item.name}</b>
            <small style={{ display: 'block', color: '#64748b', fontSize: '12px' }}>
              {item.description || 'Không có mô tả'}
            </small>
          </div>
        </div>
      ),
    },
    {
      key: 'key',
      label: 'Mã môn (Key)',
      render: item => (
        <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, color: '#0284c7' }}>
          {item.key}
        </code>
      ),
    },
    {
      key: 'gradeLevels',
      label: 'Khối lớp',
      render: item => {
        const list = Array.isArray(item.gradeLevels) && item.gradeLevels.length
          ? [...item.gradeLevels].map(Number).sort((a, b) => a - b)
          : [1, 2, 3, 4, 5];
        return (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {list.map(g => (
              <span
                key={g}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  background: '#f0f9ff',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                Lớp {g}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'lessonsCount',
      label: 'Khóa học',
      sortValue: item => item.lessonsCount || 0,
      render: item => (
        <span style={{ fontWeight: 800, color: '#334155' }}>
          {item.lessonsCount || 0} bài
        </span>
      ),
    },
    {
      key: 'order',
      label: 'Thứ tự',
      sortValue: item => item.order || 0,
      render: item => item.order ?? 0,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: item => (
        <span className={`status ${item.status === 'active' ? 'ok' : 'warning'}`}>
          {item.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: item =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
          : '—',
      sortValue: item => new Date(item.createdAt || 0).getTime(),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      sortable: false,
      render: item => (
        <div className="table-actions">
          <button className="outline" onClick={() => openEdit(item)} title="Chỉnh sửa môn học">
            <Pencil size={14} /> Sửa
          </button>
          <button className="icon-button" onClick={() => removeSubject(item)} title="Xóa môn học">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="dashboard role-admin">
      <header className="page-heading">
        <div>
          <span className="role-kicker">QUẢN TRỊ NỘI DUNG</span>
          <h1>Quản lý môn học</h1>
          <p>Thêm, sửa, xóa các môn học trên toàn hệ thống. Môn học được kích hoạt sẽ xuất hiện ở trang chủ, khu vực học sinh và giáo viên.</p>
        </div>
        <button className="primary" onClick={openCreate}>
          <Plus size={18} /> Thêm môn học mới
        </button>
      </header>

      {/* Stats row */}
      <section className="stats">
        <StatCard
          icon={<GraduationCap />}
          title="Tổng số môn học"
          value={loading ? '…' : subjects.length}
          note="Toàn bộ môn đã cấu hình"
        />
        <StatCard
          icon={<CheckCircle2 />}
          title="Đang hoạt động"
          value={loading ? '…' : activeCount}
          note="Đang mở cho học sinh & giáo viên"
          tone="mint"
        />
        <StatCard
          icon={<PauseCircle />}
          title="Tạm dừng"
          value={loading ? '…' : subjects.length - activeCount}
          note="Tạm ẩn khỏi lộ trình"
          tone="peach"
        />
        <StatCard
          icon={<BookOpen />}
          title="Tổng khóa học"
          value={loading ? '…' : totalLessons}
          note="Được phân bổ theo các môn"
        />
      </section>

      <div style={{ height: '20px' }} />

      {/* Main Table */}
      <section className="panel">
        <DataTable
          rows={subjects}
          columns={columns}
          searchKeys={['name', 'key', 'description']}
          searchPlaceholder="Tìm môn học theo tên, mã hoặc mô tả..."
          filters={[
            {
              key: 'status',
              label: 'Trạng thái',
              options: [
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Tạm dừng' },
              ],
            },
          ]}
          emptyText={loading ? 'Đang tải danh sách môn học...' : 'Chưa có môn học nào.'}
          initialSort={{ key: 'createdAt', direction: -1 }}
        />
      </section>

      {/* Create / Edit Modal */}
      {open && (
        <Modal
          className="modal-md"
          title={editingId ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
          onClose={() => setOpen(false)}
        >
          <form className="subject-form" onSubmit={save}>
            <div className="subject-form-row">
              <div className="subject-field">
                <label>
                  Tên môn học <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="VD: Tiếng Anh, Khoa học..."
                  required
                />
              </div>

              <div className="subject-field">
                <label>
                  Mã môn (Key định danh) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.key}
                  onChange={e => setForm({ ...form, key: slugify(e.target.value) })}
                  placeholder="VD: english, science..."
                  required
                />
              </div>
            </div>

            <div className="subject-field">
              <span className="field-title">Biểu tượng / Emoji</span>
              <div className="subject-emoji-container">
                <div className="subject-emoji-preview">{form.icon || '📚'}</div>
                <input
                  type="text"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="subject-emoji-input"
                  maxLength={4}
                  title="Nhập emoji tùy chọn"
                />
                <div className="subject-emoji-presets">
                  {EMOJI_PRESETS.map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setForm({ ...form, icon: emoji })}
                      className={`subject-emoji-btn ${form.icon === emoji ? 'active' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <small>Chọn nhanh từ danh sách hoặc nhập ký tự biểu cảm bất kỳ.</small>
            </div>

            <div className="subject-form-row">
              <div className="subject-field">
                <label>Tông màu nhận diện</label>
                <select
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                >
                  {COLOR_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="subject-field">
                <label>Thứ tự hiển thị</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={e => setForm({ ...form, order: Number(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>

            <div className="subject-field">
              <span className="field-title">Áp dụng cho các khối lớp</span>
              <div className="subject-grade-pills">
                {[1, 2, 3, 4, 5].map(g => {
                  const active = (form.gradeLevels || []).includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGrade(g)}
                      className={`subject-grade-pill ${active ? 'active' : ''}`}
                    >
                      Lớp {g}
                    </button>
                  );
                })}
              </div>
              <small>Chọn các khối lớp sẽ được học môn học này.</small>
            </div>

            <div className="subject-field">
              <label>Trạng thái hoạt động</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Đang hoạt động (Hiển thị cho học sinh & giáo viên)</option>
                <option value="inactive">Tạm dừng (Ẩn tạm thời khỏi hệ thống)</option>
              </select>
            </div>

            <div className="subject-field">
              <label>Mô tả tóm tắt</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả mục tiêu và nội dung chính của môn học..."
                rows={3}
              />
            </div>

            <div className="modal-actions" style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Hủy bỏ
              </button>
              <button type="submit" className="primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo môn học'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </main>
  );
}

