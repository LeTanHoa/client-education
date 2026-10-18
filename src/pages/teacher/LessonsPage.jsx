import { useEffect, useState } from 'react';
import { BookOpen, Plus, Send, Trash2, Pencil } from 'lucide-react';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmModal';

const empty = { title: '', subject: 'math', grade: 1, description: '' };
const dateLabel = value =>
  value
    ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

const statusLabel = item =>
  item.status === 'published'
    ? 'Đã công bố'
    : item.status === 'pending'
    ? 'Đang chờ duyệt'
    : item.status === 'archived'
    ? 'Đã ẩn'
    : item.status === 'rejected'
    ? 'Cần chỉnh sửa'
    : 'Bản nháp';

export default function LessonsPage() {
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState('');
  const [form, setForm] = useState(empty);

  const load = () => {
    api('/lessons')
      .then(setItems)
      .catch(e => toast.error(e.message));
    api('/subjects')
      .then(data => {
        if (Array.isArray(data) && data.length) setSubjects(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing('');
    const firstSub = subjects[0] || { key: 'math', gradeLevels: [1, 2, 3, 4, 5] };
    const validGrades =
      firstSub.gradeLevels?.length ? [...firstSub.gradeLevels].sort((a, b) => a - b) : [1, 2, 3, 4, 5];
    setForm({
      title: '',
      subject: firstSub.key,
      grade: validGrades[0] || 1,
      description: '',
    });
    setOpen(true);
  };

  const edit = item => {
    setEditing(item._id);
    setForm({
      title: item.title,
      subject: item.subject,
      grade: item.grade,
      description: item.description || '',
    });
    setOpen(true);
  };

  const handleSubjectChange = newSubjectKey => {
    const nextSub = subjects.find(s => s.key === newSubjectKey);
    const nextGrades =
      nextSub?.gradeLevels && nextSub.gradeLevels.length
        ? [...nextSub.gradeLevels].sort((a, b) => a - b)
        : [1, 2, 3, 4, 5];
    const nextGrade = nextGrades.includes(form.grade) ? form.grade : nextGrades[0];
    setForm(prev => ({
      ...prev,
      subject: newSubjectKey,
      grade: nextGrade,
    }));
  };

  const create = async another => {
    try {
      if (editing) {
        await api('/lessons/' + editing, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
        setEditing('');
        setOpen(false);
        setForm(empty);
      } else {
        await api('/lessons', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        if (another) {
          setForm(prev => ({
            ...empty,
            subject: prev.subject,
            grade: prev.grade,
          }));
        } else {
          setOpen(false);
          setForm(empty);
        }
      }
      toast.success(editing ? 'Đã cập nhật khóa học.' : 'Đã tạo khóa học.');
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteLesson = async item => {
    const confirmed = await confirm({
      title: 'Xóa khóa học',
      message: `Bạn có chắc chắn muốn xóa khóa học “${item.title}”? Toàn bộ câu hỏi, tiến độ và bài tập liên quan cũng sẽ bị xóa.`,
      confirmText: 'Xóa khóa học',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await api('/lessons/' + item._id, { method: 'DELETE' });
      toast.success('Đã xóa khóa học cùng dữ liệu liên quan.');
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const questions = item => {
    sessionStorage.setItem('editing-lesson', item._id);
    window.location.assign('/teacher/questions');
  };

  const submit = async item => {
    if (!item.questionCount) {
      toast.error('Hãy soạn ít nhất một câu hỏi trước khi gửi duyệt.');
      return;
    }
    try {
      await api('/lessons/' + item._id + '/submit', { method: 'POST' });
      toast.success('Đã gửi khóa học để duyệt.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const subjectMap = subjects.reduce(
    (acc, s) => {
      acc[s.key] = s;
      return acc;
    },
    { math: { name: 'Toán học' }, vietnamese: { name: 'Tiếng Việt' } }
  );

  const subjectOptions = subjects.length
    ? subjects.map(s => ({
        value: s.key,
        label: `${s.icon || '📚'} ${s.name}`,
      }))
    : [
        { value: 'math', label: 'Toán học' },
        { value: 'vietnamese', label: 'Tiếng Việt' },
      ];

  // Dynamic grade options based on currently selected subject in form
  const selectedSubjectData = subjects.find(s => s.key === form.subject);
  const availableGrades =
    selectedSubjectData?.gradeLevels && selectedSubjectData.gradeLevels.length
      ? [...selectedSubjectData.gradeLevels].sort((a, b) => a - b)
      : [1, 2, 3, 4, 5];

  const columns = [
    {
      key: 'title',
      label: 'Khóa học',
      render: item => (
        <>
          <b>{item.title}</b>
          <small className="table-subtext">{item.description || '—'}</small>
        </>
      ),
    },
    {
      key: 'grade',
      label: 'Lớp',
      render: item => `Lớp ${item.grade}`,
    },
    {
      key: 'subject',
      label: 'Môn học',
      render: item =>
        subjectMap[item.subject]?.name ||
        (item.subject === 'math' ? 'Toán học' : item.subject === 'vietnamese' ? 'Tiếng Việt' : item.subject),
    },
    { key: 'questionCount', label: 'Câu hỏi' },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: item => dateLabel(item.createdAt),
      sortValue: item => new Date(item.createdAt || 0).getTime(),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: item => (
        <span className={'status ' + (item.status === 'published' ? 'ok' : 'warning')}>
          {statusLabel(item)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      sortable: false,
      render: item => (
        <div className="table-actions">
          <button className="outline" onClick={() => edit(item)}>
            <Pencil size={14} /> Sửa
          </button>
          <button className="outline" onClick={() => questions(item)}>
            <BookOpen size={15} /> Câu hỏi
          </button>
          {(item.status === 'draft' || item.status === 'rejected') && (
            <button
              className="primary"
              title={!item.questionCount ? 'Cần ít nhất một câu hỏi' : ''}
              disabled={!item.questionCount}
              onClick={() => submit(item)}
            >
              <Send size={14} /> Gửi duyệt
            </button>
          )}
          <button
            className="icon-button"
            title="Xóa khóa học"
            onClick={() => deleteLesson(item)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="dashboard role-teacher">
      <header className="page-heading">
        <div>
          <span className="role-kicker">QUẢN LÝ NỘI DUNG</span>
          <h1>Khóa học của tôi</h1>
          <p>Tạo các bài học, bổ sung câu hỏi thực hành và gửi kiểm duyệt trước khi công bố.</p>
        </div>
        <button className="primary" onClick={openCreate}>
          <Plus size={18} /> Tạo khóa học
        </button>
      </header>

      <section className="panel">
        <DataTable
          rows={items}
          columns={columns}
          searchKeys={['title', 'description']}
          searchPlaceholder="Tìm khóa học"
          filters={[
            {
              key: 'grade',
              label: 'Khối lớp',
              options: [1, 2, 3, 4, 5].map(value => ({
                value: String(value),
                label: `Lớp ${value}`,
              })),
            },
            { key: 'subject', label: 'Môn học', options: subjectOptions },
            {
              key: 'status',
              label: 'Trạng thái',
              options: [
                { value: 'draft', label: 'Bản nháp' },
                { value: 'pending', label: 'Chờ duyệt' },
                { value: 'published', label: 'Đã công bố' },
                { value: 'rejected', label: 'Cần chỉnh sửa' },
                { value: 'archived', label: 'Đã ẩn' },
              ],
            },
          ]}
          emptyText="Chưa có khóa học."
          initialSort={{ key: 'createdAt', direction: -1 }}
        />
      </section>

      {open && (
        <Modal
          className="modal-md"
          title={editing ? 'Sửa khóa học' : 'Tạo khóa học mới'}
          onClose={() => {
            setOpen(false);
            setEditing('');
          }}
        >
          <div className="form" style={{ gap: '14px' }}>
            {!editing && (
              <p className="form-hint" style={{ margin: 0 }}>
                Bạn có thể tạo tiếp nhiều khóa học, chưa cần thêm câu hỏi ngay.
              </p>
            )}

            <label>
              Tên khóa học <span style={{ color: '#ef4444' }}>*</span>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="VD: Phép nhân trong phạm vi 100..."
                required
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '12px' }}>
              <label>
                Môn học <span style={{ color: '#ef4444' }}>*</span>
                <select
                  value={form.subject}
                  onChange={e => handleSubjectChange(e.target.value)}
                >
                  {subjectOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Khối lớp <span style={{ color: '#ef4444' }}>*</span>
                <select
                  value={form.grade}
                  onChange={e => setForm({ ...form, grade: Number(e.target.value) })}
                >
                  {availableGrades.map(x => (
                    <option key={x} value={x}>
                      Lớp {x}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedSubjectData && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#0369a1',
                  fontWeight: 600,
                }}
              >
                <span>ℹ️</span>
                <span>
                  Môn <b>{selectedSubjectData.name}</b> chỉ áp dụng cho khối:{' '}
                  <b>{availableGrades.map(g => `Lớp ${g}`).join(', ')}</b>
                </span>
              </div>
            )}

            <label>
              Mô tả
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả nội dung chính của khóa học..."
                rows={3}
              />
            </label>

            <div className="modal-actions" style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="outline"
                onClick={() => {
                  setOpen(false);
                  setEditing('');
                }}
              >
                Hủy bỏ
              </button>
              {!editing && (
                <button
                  type="button"
                  className="outline"
                  disabled={!form.title.trim()}
                  onClick={() => create(true)}
                >
                  Lưu & tạo tiếp
                </button>
              )}
              <button
                type="button"
                className="primary"
                disabled={!form.title.trim()}
                onClick={() => create(false)}
              >
                {editing ? 'Lưu thay đổi' : 'Lưu bản nháp'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
