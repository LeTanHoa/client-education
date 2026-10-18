export default function ProgressBar({ value = 0, color = 'green' }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="progress-line">
      <i className={color} style={{ width: `${safeValue}%` }} />
    </div>
  );
}

