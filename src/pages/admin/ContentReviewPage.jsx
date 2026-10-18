import { useEffect, useState } from 'react';
import { ArchiveRestore, EyeOff, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmModal';

const grades = [1, 2, 3, 4, 5].map(value => ({ value: String(value), label: `Lớp ${value}` }));

export default function ContentReviewPage() {
  const [pending, setPending] = useState([]);
  const [published, setPublished] = useState([]);
  const [archived, setArchived] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tab, setTab] = useState('pending');
  const [detail, setDetail] = useState(null);

  const load = async () => {
    try {
      const [p, r, a, s] = await Promise.all([
        api('/lessons?status=pending'),
        api('/lessons?status=published'),
        api('/lessons?status=archived'),
        api('/subjects?all=true').catch(() => []),
      ]);
      setPending(p);
      setPublished(r);
      setArchived(a);
      if (Array.isArray(s) && s.length) setSubjects(s);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (id, status) => {
    try {
      await api('/lessons/' + id, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success(
        status === 'published'
          ? 'Đã công bố khóa học.'
          : status === 'archived'
          ? 'Đã ẩn khóa học.'
          : 'Đã cập nhật trạng thái khóa học.'
      );
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async item => {
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

  const show = async item => {
    try {
      setDetail(await api('/lessons/' + item._id + '/questions'));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const rows = tab === 'pending' ? pending : tab === 'published' ? published : archived;
  const subjectMap = subjects.reduce(
    (acc, s) => {
      acc[s.key] = s;
      return acc;
    },
    { math: { name: 'Toán học' }, vietnamese: { name: 'Tiếng Việt' } }
  );

  const subjectOptions = subjects.length
    ? subjects.map(s => ({ value: s.key, label: s.name }))
    : [
        { value: 'math', label: 'Toán học' },
        { value: 'vietnamese', label: 'Tiếng Việt' },
      ];

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
    { key: 'createdBy.name', label: 'Giáo viên' },
    { key: 'grade', label: 'Khối lớp', render: item => `Lớp ${item.grade}` },
    {
      key: 'subject',
      label: 'Môn học',
      render: item =>
        subjectMap[item.subject]?.name ||
        (item.subject === 'math' ? 'Toán học' : item.subject === 'vietnamese' ? 'Tiếng Việt' : item.subject),
    },
    { key: 'questionCount', label: 'Số câu hỏi' },
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
          <button className="outline" onClick={() => show(item)}>
            Câu hỏi
          </button>
          {tab === 'pending' && (
            <>
              <button className="outline" onClick={() => review(item._id, 'rejected')}>
                Từ chối
              </button>
              <button className="primary" onClick={() => review(item._id, 'published')}>
                Công bố
              </button>
            </>
          )}
          {tab === 'published' && (
            <button className="outline" onClick={() => review(item._id, 'archived')}>
              <EyeOff size={15} /> Ẩn
            </button>
          )}
          {tab === 'archived' && (
            <button className="primary" onClick={() => review(item._id, 'published')}>
              <ArchiveRestore size={15} /> Công bố
            </button>
          )}
          <button className="icon-button" title="Xóa khóa học" onClick={() => remove(item)}>
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
          <h1>Duyệt nội dung khóa học</h1>
          <p>Kiểm duyệt chất lượng, công bố hoặc tạm ẩn các bài học và khóa học trong hệ thống.</p>
        </div>
        <span className="pill">{pending.length} chờ duyệt</span>
      </header>

      <div className="content-tabs">
        <button className={tab === 'pending' ? 'selected' : ''} onClick={() => setTab('pending')}>
          Chờ duyệt ({pending.length})
        </button>
        <button className={tab === 'published' ? 'selected' : ''} onClick={() => setTab('published')}>
          Đang công bố ({published.length})
        </button>
        <button className={tab === 'archived' ? 'selected' : ''} onClick={() => setTab('archived')}>
          Đã ẩn ({archived.length})
        </button>
      </div>

      <section className="panel">
        <DataTable
          key={tab}
          rows={rows}
          columns={columns}
          searchKeys={['title', 'description', 'createdBy.name']}
          searchPlaceholder="Tìm khóa học hoặc giáo viên"
          filters={[
            { key: 'grade', label: 'Khối lớp', options: grades },
            { key: 'subject', label: 'Môn học', options: subjectOptions },
          ]}
          emptyText="Không có khóa học phù hợp."
          initialSort={{ key: 'createdAt', direction: -1 }}
        />
      </section>

      {detail && (
        <Modal className="modal-md" title={detail.lesson.title} onClose={() => setDetail(null)}>
          <p className="form-hint">{detail.questions.length} câu hỏi trong khóa học</p>
          <div className="question-preview">
            {detail.questions.map((q, i) => (
              <article key={q._id}>
                <b>
                  Câu {i + 1}. {q.content}
                </b>
                <p>
                  {q.type === 'multiple_choice'
                    ? 'Trắc nghiệm'
                    : q.type === 'fill_blank'
                    ? 'Điền khuyết'
                    : q.type === 'drag_drop'
                    ? 'Kéo thả'
                    : 'Nối cặp'}
                </p>
                {q.options?.length > 0 && (
                  <ul>
                    {q.options.map(x => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </Modal>
      )}
    </main>
  );
}
