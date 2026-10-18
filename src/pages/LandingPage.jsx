import { useEffect, useState } from 'react';
import {
  BookOpen, CheckCircle2, Heart, Lightbulb, LogIn, MessageSquare,
  Send, ShieldCheck, Star, Target, Users, Zap, ChevronDown, Quote, ArrowUp, X, Sparkles, Compass, Award,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Brand from '../components/Brand';
import { api } from '../lib/api';
import { toast } from '../components/Toast';
import SlickModule from 'react-slick';
import 'slick-carousel/slick/slick.css';

const Slider = SlickModule.default || SlickModule;

/* ─── Custom Slider Arrows ─── */
const SlickPrevArrow = ({ className, style, onClick }) => (
  <button
    type="button"
    className={`lp-slider-arrow lp-slider-prev ${className || ''}`}
    style={{ ...style }}
    onClick={onClick}
    aria-label="Xem phản hồi trước"
  >
    <ChevronLeft size={22} />
  </button>
);

const SlickNextArrow = ({ className, style, onClick }) => (
  <button
    type="button"
    className={`lp-slider-arrow lp-slider-next ${className || ''}`}
    style={{ ...style }}
    onClick={onClick}
    aria-label="Xem phản hồi tiếp theo"
  >
    <ChevronRight size={22} />
  </button>
);

/* ─── Static content ─── */
const philosophy = [
  {
    icon: Lightbulb, color: 'phi-sky',
    title: 'Hiểu trước, nhớ lâu',
    text: 'Chúng tôi tin rằng việc hiểu bản chất kiến thức quan trọng hơn ghi nhớ máy móc. Mỗi bài học được thiết kế để học sinh tự khám phá, đặt câu hỏi và tìm ra đáp án theo cách riêng của mình.'
  },
  {
    icon: Heart, color: 'phi-rose',
    title: 'Học với niềm vui',
    text: 'Học tập hiệu quả nhất khi học sinh cảm thấy hứng thú. Chúng tôi kết hợp trò chơi hoá, thành tích và sự khích lệ tích cực để tạo ra môi trường học tập đáng yêu và an toàn.'
  },
  {
    icon: Users, color: 'phi-teal',
    title: 'Cộng đồng học tập',
    text: 'Giáo dục là hành trình của cả cộng đồng — học sinh, giáo viên và phụ huynh. Nền tảng của chúng tôi gắn kết ba nhân tố quan trọng này để cùng nhau đồng hành và phát triển.'
  },
];

const missions = [
  { icon: Target, label: 'Cá nhân hóa trải nghiệm', text: 'Mỗi học sinh có lộ trình học riêng phù hợp với tốc độ và phong cách học tập của mình.' },
  { icon: Zap, label: 'Phản hồi tức thì & liên tục', text: 'Giải thích chi tiết ngay sau mỗi câu trả lời giúp học sinh điều chỉnh và cải thiện ngay lập tức.' },
  { icon: ShieldCheck, label: 'An toàn & tin cậy tuyệt đối', text: 'Dữ liệu học sinh được bảo mật theo tiêu chuẩn cao nhất. Nội dung được kiểm duyệt kỹ lưỡng trước khi xuất bản.' },
  { icon: BookOpen, label: 'Bám sát chương trình chuẩn', text: 'Bộ bài học và câu hỏi thực hành phong phú được xây dựng bởi đội ngũ giáo viên giàu kinh nghiệm.' },
];

const commitments = [
  '100% không quảng cáo, không nội dung gây phân tâm khi học.',
  'Cập nhật nội dung liên tục bám sát chương trình GDPT mới nhất.',
  'Tương thích hoàn hảo trên máy tính, máy tính bảng và điện thoại.',
  'Lắng nghe và cải tiến liên tục từ ý kiến phản hồi của người dùng.',
  'Minh bạch tuyệt đối trong việc theo dõi tiến độ và thành tích.',
  'Bảo vệ quyền riêng tư và dữ liệu của học sinh ở mức cao nhất.',
];

const FALLBACK_SUBJECTS = [
  { key: 'math', name: 'Toán học', icon: '📐', color: 'sky', description: 'Rèn luyện tư duy logic, phép tính và giải quyết vấn đề qua các bài toán sinh động.', gradeLevels: [1, 2, 3, 4, 5], lessonsCount: 20 },
  { key: 'vietnamese', name: 'Tiếng Việt', icon: '📖', color: 'orange', description: 'Làm giàu vốn từ vựng, rèn luyện kỹ năng đọc hiểu, chính tả và cảm thụ ngôn từ.', gradeLevels: [1, 2, 3, 4, 5], lessonsCount: 15 },
  { key: 'english', name: 'Tiếng Anh', icon: '🌍', color: 'emerald', description: 'Làm quen từ vựng cơ bản, phát âm chuẩn và các mẫu câu giao tiếp tự nhiên hằng ngày.', gradeLevels: [1, 2, 3, 4, 5], lessonsCount: 12 },
  { key: 'science', name: 'Khoa học & Tự nhiên', icon: '🔬', color: 'purple', description: 'Khám phá thế giới động thực vật kỳ thú và những hiện tượng khoa học diệu kỳ quanh ta.', gradeLevels: [1, 2, 3, 4, 5], lessonsCount: 10 },
  { key: 'informatics', name: 'Tin học & Công nghệ', icon: '💻', color: 'teal', description: 'Làm quen với máy tính, tư duy thuật toán trực quan và kỹ năng số thông minh, an toàn.', gradeLevels: [3, 4, 5], lessonsCount: 8 },
];

const ROLES = ['student', 'parent', 'teacher', 'other'];
const ROLE_LABELS = { student: 'Học sinh', parent: 'Phụ huynh', teacher: 'Giáo viên', other: 'Khác' };

const getInitialSlides = () => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth <= 850) return 1;
    if (window.innerWidth <= 1024) return 2;
  }
  return 3;
};

const reviewSliderSettings = {
  dots: true,
  arrows: true,
  prevArrow: <SlickPrevArrow />,
  nextArrow: <SlickNextArrow />,
  infinite: true,
  autoplay: true,
  autoplaySpeed: 5000,
  pauseOnHover: true,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      }
    },
    {
      breakpoint: 850,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
      }
    }
  ]
};

const StarRating = ({ value, onChange }) => (
  <div className="lp-star-row">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" className={`lp-star ${n <= value ? 'filled' : ''}`} onClick={() => onChange(n)}>
        <Star size={22} fill={n <= value ? '#0EA5E9' : 'none'} color={n <= value ? '#0EA5E9' : '#CBD5E1'} />
      </button>
    ))}
  </div>
);

export default function LandingPage({ onGoLogin }) {
  const [reviews, setReviews] = useState([]);
  const [subjects, setSubjects] = useState(FALLBACK_SUBJECTS);
  const [selectedGradeTab, setSelectedGradeTab] = useState('all');
  const [form, setForm] = useState({ name: '', role: 'student', content: '', rating: 5 });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [previewReview, setPreviewReview] = useState(null);
  const [slidesToShow, setSlidesToShow] = useState(getInitialSlides);

  useEffect(() => {
    const handleResize = () => setSlidesToShow(getInitialSlides());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatGradesBadge = gradesList => {
    const grades = Array.isArray(gradesList) && gradesList.length
      ? [...gradesList].sort((a, b) => a - b)
      : [1, 2, 3, 4, 5];
    if (grades.length === 5) return 'Lớp 1 - 5';
    if (grades.length === 1) return `Lớp ${grades[0]}`;
    const isContiguous = grades.every((g, i) => i === 0 || g === grades[i - 1] + 1);
    if (isContiguous) return `Lớp ${grades[0]} - ${grades[grades.length - 1]}`;
    return grades.map(g => `Lớp ${g}`).join(', ');
  };

  useEffect(() => {
    api('/feedback/approved').then(setReviews).catch(() => {});
    api('/subjects').then(data => {
      if (Array.isArray(data) && data.length) setSubjects(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const updateBackToTop = () => setShowBackToTop(window.scrollY > 420);
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    updateBackToTop();
    return () => window.removeEventListener('scroll', updateBackToTop);
  }, []);

  useEffect(() => {
    const closeOnEscape = event => event.key === 'Escape' && setPreviewReview(null);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const submitFeedback = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) { toast.error('Vui lòng điền đầy đủ tên và nội dung.'); return; }
    setSending(true);
    try {
      await api('/feedback', { method: 'POST', body: JSON.stringify(form) });
      setSent(true);
      toast.success('Cảm ơn bạn! Phản hồi đã được ghi nhận.');
      setForm({ name: '', role: 'student', content: '', rating: 5 });
    } catch (err) { toast.error(err.message); }
    finally { setSending(false); }
  };

  const faqs = [
    { q: 'H phù hợp với lứa tuổi và khối lớp nào?', a: 'H được thiết kế chuyên biệt cho học sinh tiểu học (từ lớp 1 đến lớp 5), tập trung vào hai môn học nền tảng là Toán học và Tiếng Việt theo chương trình giáo dục phổ thông mới của Bộ Giáo dục & Đào tạo.' },
    { q: 'Làm thế nào để giáo viên giao bài tập và theo dõi điểm số?', a: 'Giáo viên chỉ cần đăng nhập bằng tài khoản được cấp, chọn bài học cần giao trong thư viện, chọn học sinh hoặc cả lớp và đặt hạn nộp. Khi học sinh hoàn thành, hệ thống sẽ tự động chấm điểm và báo cáo chi tiết.' },
    { q: 'Hệ thống điểm kinh nghiệm (XP), xu và huy hiệu hoạt động ra sao?', a: 'Học sinh tích lũy XP qua mỗi câu trả lời đúng, hoàn thành bài học và duy trì chuỗi ngày điểm danh liên tục (streak 🔥). Đạt mốc XP nhất định sẽ tự động thăng cấp và nhận các huy hiệu danh giá.' },
    { q: 'Học sinh có thể tự luyện tập mà không cần bài tập giáo viên giao không?', a: 'Hoàn toàn được! Học sinh có thể tự do mở "Khám phá bài học", chọn môn Toán hoặc Tiếng Việt và thực hành bất cứ bài học nào theo nhịp độ riêng của mình.' },
    { q: 'Dữ liệu cá nhân và quá trình học tập có được bảo mật không?', a: 'Có. Toàn bộ thông tin tài khoản và kết quả học tập được mã hóa và lưu trữ an toàn trên máy chủ riêng biệt, tuyệt đối không chia sẻ cho bên thứ ba.' },
  ];

  return (
    <div className="lp-root">
      {/* ── NAVBAR ── */}
      <nav className="lp-nav">
        <Brand />
        <div className="lp-nav-links">
          <a href="#philosophy">Triết lý</a>
          <a href="#subjects">Môn học</a>
          <a href="#mission">Phương châm</a>
          <a href="#commitment">Cam kết</a>
          <a href="#reviews">Phản hồi</a>
          <a href="#faq">Hỏi &amp; Đáp</a>
        </div>
        <button className="lp-login-btn" onClick={onGoLogin}>
          <LogIn size={17} /> <span>Đăng nhập</span>
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg-glow" />
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <Sparkles size={14} className="lp-badge-sparkle" />
            <span>NỀN TẢNG HỌC TẬP TIỂU HỌC THẾ HỆ MỚI</span>
          </div>

          <h1>
            Học <span className="lp-hero-gradient-text">vui mỗi ngày</span>,<br />
            vững bước tương lai
          </h1>

          <p className="lp-hero-desc">
            Không gian học tập trực tuyến thông minh, tương tác cao dành cho học sinh tiểu học.
            Kết hợp kiến thức chuẩn mực cùng trải nghiệm trò chơi hoá hào hứng và thân thiện.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn-primary lp-btn-glow" onClick={onGoLogin}>
              <span>Khám phá ngay</span>
              <Compass size={18} />
            </button>
            <a href="#subjects" className="lp-btn-ghost">
              Xem các môn học
            </a>
          </div>

          <div className="lp-stats-row">
            {[
              { value: '500+', label: 'Câu hỏi thực hành', icon: '📚' },
              { value: '98%', label: 'Học sinh tiến bộ', icon: '📈' },
              { value: '100%', label: 'Không quảng cáo', icon: '🛡️' },
              { value: `${subjects.length || 5} Môn`, label: 'Chương trình đa dạng', icon: '✨' },
            ].map(s => (
              <div key={s.label} className="lp-stat-chip">
                <span className="lp-stat-emoji">{s.icon}</span>
                <div>
                  <b>{s.value}</b>
                  <span>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Interactive Art Card */}
        <div className="lp-hero-art" aria-hidden>
          <div className="lp-hero-card-main">
            <div className="lp-hcm-header">
              <div className="lp-hcm-user">
                <span className="lp-hcm-avatar">HV</span>
                <div>
                  <b>Học sinh xuất sắc</b>
                  <small>Lớp 3A · Cấp độ 5</small>
                </div>
              </div>
              <span className="lp-hcm-streak">🔥 14 ngày</span>
            </div>

            <div className="lp-hcm-subject-item">
              <div className="lp-hcm-subj-info">
                <span>🔢 Toán học: Phép nhân &amp; Phép chia</span>
                <b>85%</b>
              </div>
              <div className="lp-hcm-prog"><i style={{ width: '85%' }} /></div>
            </div>

            <div className="lp-hcm-subject-item">
              <div className="lp-hcm-subj-info">
                <span>📖 Tiếng Việt: Từ ngữ chỉ hoạt động</span>
                <b>100%</b>
              </div>
              <div className="lp-hcm-prog"><i style={{ width: '100%' }} /></div>
            </div>

            <div className="lp-hcm-footer">
              <div className="lp-hcm-pill"><span>🪙</span> <b>120 Xu</b></div>
              <div className="lp-hcm-pill"><span>⚡</span> <b>650 XP</b></div>
              <div className="lp-hcm-pill"><span>🏆</span> <b>5 Huy hiệu</b></div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="lp-floating-badge b1">
            <Award size={18} />
            <span>Thành tích: Ong vàng chăm chỉ</span>
          </div>
          <div className="lp-floating-badge b2">
            <CheckCircle2 size={18} />
            <span>100% Bài học tương tác</span>
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section id="philosophy" className="lp-section lp-philosophy">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-eyebrow">TRIẾT LÝ GIÁO DỤC</span>
            <h2>Nền tảng kiến tạo từ sự thấu hiểu</h2>
            <p>Mỗi tính năng và bài giảng đều được chắt lọc nhằm khơi dậy trí tò mò, nuôi dưỡng niềm đam mê học hỏi tự nhiên của trẻ thơ.</p>
          </div>
          <div className="lp-phi-grid">
            {philosophy.map(({ icon: Icon, color, title, text }) => (
              <article key={title} className={`lp-phi-card ${color}`}>
                <div className="lp-phi-icon"><Icon size={26} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <section id="subjects" className="lp-section lp-subjects-section">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-eyebrow">CHƯƠNG TRÌNH ĐÀO TẠO</span>
            <h2>Hệ thống môn học tại H</h2>
            <p>
              Được thiết kế chuyên sâu cho bậc tiểu học, kết hợp hài hòa giữa kiến thức chuẩn mực của Bộ Giáo dục
              và phương pháp học tập tương tác, kích thích tư duy chủ động.
            </p>
          </div>

          {/* Grade filter tabs */}
          <div className="lp-subjects-filter-tabs">
            <span className="lp-filter-label">Khối lớp:</span>
            {['all', 1, 2, 3, 4, 5].map(g => (
              <button
                key={g}
                type="button"
                className={`lp-grade-filter-btn ${selectedGradeTab === String(g) ? 'active' : ''}`}
                onClick={() => setSelectedGradeTab(String(g))}
              >
                {g === 'all' ? 'Tất cả khối lớp' : `Lớp ${g}`}
              </button>
            ))}
          </div>

          <div className="lp-subjects-grid">
            {subjects
              .filter(s =>
                selectedGradeTab === 'all'
                  ? true
                  : (s.gradeLevels || [1, 2, 3, 4, 5]).includes(Number(selectedGradeTab))
              )
              .map(s => {
                const grades = (s.gradeLevels && s.gradeLevels.length)
                  ? [...s.gradeLevels].sort((a, b) => a - b)
                  : [1, 2, 3, 4, 5];
                const badgeText = formatGradesBadge(grades);
                return (
                  <article key={s.key || s._id} className={`lp-subject-card ${s.color || 'sky'}`}>
                    <div className="lp-subject-card-head">
                      <span className="lp-subject-icon">{s.icon || '📚'}</span>
                      <span className="lp-subject-grade-badge">{badgeText}</span>
                    </div>
                    <h3>{s.name}</h3>
                    <p>{s.description || 'Chương trình bài học và câu hỏi thực hành sinh động.'}</p>

                    <div className="lp-subject-grade-pills">
                      {grades.map(g => (
                        <span
                          key={g}
                          className={`lp-mini-grade ${selectedGradeTab === String(g) ? 'highlight' : ''}`}
                        >
                          Lớp {g}
                        </span>
                      ))}
                    </div>

                    <div className="lp-subject-foot">
                      <span className="lp-subject-lessons-count">
                        <BookOpen size={16} />
                        <b>{s.lessonsCount ?? 0} bài học</b>
                      </span>
                      <button type="button" className="lp-subject-explore-btn" onClick={onGoLogin}>
                        <span>Khám phá</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section id="mission" className="lp-section lp-mission">
        <div className="lp-section-inner lp-mission-inner">
          <div className="lp-mission-text">
            <span className="lp-eyebrow">PHƯƠNG CHÂM HOẠT ĐỘNG</span>
            <h2>Chuẩn mực trong giáo dục,<br />tinh tế trong công nghệ</h2>
            <p className="lp-mission-sub">
              Chúng tôi cam kết xây dựng một môi trường học tập số hiện đại, trực quan,
              nơi mỗi học sinh đều cảm thấy được đồng hành và tự tin chinh phục kiến thức mới mỗi ngày.
            </p>
            <div className="lp-mission-list">
              {missions.map(({ icon: Icon, label, text }) => (
                <div key={label} className="lp-mission-item">
                  <span className="lp-mission-icon"><Icon size={20} /></span>
                  <div>
                    <b>{label}</b>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-mission-visual">
            <div className="lp-mission-card">
              <div className="lp-mc-top">
                <span className="lp-mc-badge">✨ Nhiệm vụ hôm nay</span>
                <small className="lp-mc-date">Cập nhật mỗi ngày</small>
              </div>

              <div className="lp-mc-quest-row">
                <span className="lp-mc-qicon done">✓</span>
                <div>
                  <b>Điểm danh đầu ngày</b>
                  <small>+5 xu · +20 XP</small>
                </div>
                <span className="lp-mc-qdone">Đã hoàn thành</span>
              </div>

              <div className="lp-mc-quest-row">
                <span className="lp-mc-qicon inprog">📖</span>
                <div>
                  <b>Luyện tập 1 bài Toán học</b>
                  <small>+10 xu · +50 XP</small>
                </div>
                <span className="lp-mc-qprog">Đang học</span>
              </div>

              <div className="lp-mc-stats">
                <div>
                  <b>🔥 14 Ngày</b>
                  <small>Chuỗi liên tiếp</small>
                </div>
                <div>
                  <b>⚡ 650 XP</b>
                  <small>Tổng kinh nghiệm</small>
                </div>
                <div>
                  <b>🪙 120 Xu</b>
                  <small>Kho báu tích lũy</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMITMENT ── */}
      <section id="commitment" className="lp-section lp-commitment">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-eyebrow">CAM KẾT CHẤT LƯỢNG</span>
            <h2>6 Lời hứa vững chắc với phụ huynh &amp; học sinh</h2>
            <p>Chất lượng và sự an toàn của học sinh luôn là kim chỉ nam trong mọi quyết định phát triển sản phẩm của H.</p>
          </div>
          <div className="lp-commit-grid">
            {commitments.map((text, i) => (
              <div key={i} className="lp-commit-item">
                <span className="lp-commit-check"><CheckCircle2 size={20} /></span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS CAROUSEL ── */}
      <section id="reviews" className="lp-section lp-reviews">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-eyebrow">TIẾNG NÓI TỪ CỘNG ĐỒNG</span>
            <h2>Học sinh &amp; Phụ huynh nói gì?</h2>
            <p>Hàng trăm lời động viên và chia sẻ chân thành từ những bạn nhỏ cùng gia đình đang trải nghiệm H.</p>
          </div>

          {reviews.length > 0 ? (
            <div className="lp-review-slider">
              <Slider key={`slider-${slidesToShow}`} {...reviewSliderSettings} slidesToShow={slidesToShow}>
                {reviews.map(r => (
                  <div key={r._id}>
                    <article className="lp-review-card" >
                      <div className="lp-review-top">
                        <Quote size={20} className="lp-quote-icon" />
                        <div className="lp-review-stars">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={14} fill={n <= r.rating ? '#0EA5E9' : 'none'} color={n <= r.rating ? '#0EA5E9' : '#CBD5E1'} />
                          ))}
                        </div>
                      </div>
                      <p className="lp-review-content">"{r.content}"</p>
                      <div className="lp-review-author">
                        <span className="lp-review-avatar">{r.name[0]?.toUpperCase()}</span>
                        <div>
                          <b>{r.name}</b>
                          <small>{ROLE_LABELS[r.role] || 'Người dùng'}</small>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <div className="lp-review-empty">
              <MessageSquare size={36} />
              <p>Chưa có phản hồi nào được xuất bản. Hãy là người đầu tiên chia sẻ cảm nhận!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FEEDBACK FORM ── */}
      <section id="feedback" className="lp-section lp-feedback-section">
        <div className="lp-section-inner lp-feedback-inner">
          <div className="lp-feedback-text">
            <span className="lp-eyebrow">HÒM THƯ GÓP Ý</span>
            <h2>Ý kiến của bạn là động lực để H hoàn thiện</h2>
            <p>Mỗi chia sẻ, đóng góp đều được đội ngũ lắng nghe cẩn trọng để mang đến trải nghiệm học tập ngày càng tuyệt vời hơn.</p>
            <div className="lp-feedback-hints">
              <div className="lp-hint-item"><CheckCircle2 size={16} /> Ý kiến sau khi duyệt sẽ được đăng trên bảng vinh danh</div>
              <div className="lp-hint-item"><CheckCircle2 size={16} /> Tuyệt đối bảo mật thông tin liên lạc cá nhân</div>
              <div className="lp-hint-item"><CheckCircle2 size={16} /> Ban quản trị phản hồi và ghi nhận liên tục</div>
            </div>
          </div>

          <div className="lp-feedback-form-wrap">
            {sent ? (
              <div className="lp-sent-state">
                <span className="lp-sent-emoji">🎉</span>
                <h3>Cảm ơn bạn rất nhiều!</h3>
                <p>Phản hồi của bạn đã được chuyển tới ban quản trị và sẽ được phản hồi sớm nhất.</p>
                <button className="lp-btn-ghost" onClick={() => setSent(false)}>Gửi thêm ý kiến khác</button>
              </div>
            ) : (
              <form className="lp-feedback-form" onSubmit={submitFeedback}>
                <div className="lp-form-row">
                  <label>
                    Họ và tên <span className="req">*</span>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Nguyễn Văn A"
                      maxLength={80}
                      required
                    />
                  </label>
                  <label>
                    Bạn là
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </label>
                </div>

                <label>
                  Đánh giá tổng quan
                  <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                </label>

                <label>
                  Nội dung phản hồi hoặc đóng góp <span className="req">*</span>
                  <textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Hãy chia sẻ trải nghiệm học tập hoặc những điểm bạn muốn H nâng cấp..."
                    rows={4}
                    maxLength={1000}
                    required
                  />
                  <small className="lp-char-count">{form.content.length}/1000 ký tự</small>
                </label>

                <button type="submit" className="lp-btn-primary lp-submit-btn" disabled={sending}>
                  <Send size={17} /> {sending ? 'Đang gửi...' : 'Gửi phản hồi ngay'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="lp-section lp-faq">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-eyebrow">HỎI ĐÁP THƯỜNG GẶP</span>
            <h2>Những điều bạn quan tâm</h2>
            <p>Tổng hợp câu trả lời cho các thắc mắc phổ biến nhất khi bắt đầu sử dụng H.</p>
          </div>
          <div className="lp-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`lp-faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`lp-faq-arrow ${openFaq === i ? 'rotated' : ''}`} />
                </button>
                {openFaq === i && <p className="lp-faq-a">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="lp-footer-cta">
        <div className="lp-section-inner">
          <span className="lp-fcta-badge">🌟 BẮT ĐẦU NGAY HÔM NAY</span>
          <h2>Cùng con khám phá niềm vui học tập mỗi ngày</h2>
          <p>Mỗi bước đi nhỏ hôm nay là hành trang vững chắc cho tương lai con trẻ.</p>
          <button className="lp-btn-white" onClick={onGoLogin}>
            Đăng nhập &amp; Bắt đầu học →
          </button>
        </div>
      </section>

      {/* ── REVIEW PREVIEW MODAL ── */}
      {previewReview && (
        <div className="lp-review-preview" role="presentation" onClick={() => setPreviewReview(null)}>
          <article className="lp-review-preview-card" role="dialog" aria-modal="true" aria-label="Chi tiết phản hồi" onClick={event => event.stopPropagation()}>
            <button type="button" className="lp-review-preview-close" aria-label="Đóng" onClick={() => setPreviewReview(null)}>
              <X size={18} />
            </button>
            <div className="lp-review-preview-top">
              <span className="lp-review-avatar">{previewReview.name[0]?.toUpperCase()}</span>
              <div>
                <b>{previewReview.name}</b>
                <small>{ROLE_LABELS[previewReview.role] || 'Người dùng'}</small>
              </div>
              <div className="lp-review-stars">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={16} fill={n <= previewReview.rating ? '#0EA5E9' : 'none'} color={n <= previewReview.rating ? '#0EA5E9' : '#CBD5E1'} />
                ))}
              </div>
            </div>
            <p>“{previewReview.content}”</p>
          </article>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-section-inner lp-footer-inner">
          <div className="lp-footer-brand">
            <Brand />
            <p>Hệ thống giáo dục trực tuyến tiểu học hàng đầu</p>
          </div>
          <div className="lp-footer-links">
            <a href="#philosophy">Triết lý</a>
            <a href="#mission">Phương châm</a>
            <a href="#commitment">Cam kết</a>
            <a href="#reviews">Phản hồi</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
        <p className="lp-footer-copy">© 2026 H. Nền tảng học tập tiểu học chuẩn mực &amp; hiện đại.</p>
      </footer>

      {/* Floating Buttons */}
      <a
        className="lp-zalo-button"
        href="https://zalo.me/0384316021"
        target="_blank"
        rel="noreferrer"
        aria-label="Liên hệ qua Zalo"
        title="Liên hệ tư vấn qua Zalo"
      >
        <span>Zalo</span>
      </a>

      <button
        type="button"
        className={`lp-back-to-top ${showBackToTop ? 'visible' : ''}`}
        aria-label="Cuộn lên đầu trang"
        title="Lên đầu trang"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
