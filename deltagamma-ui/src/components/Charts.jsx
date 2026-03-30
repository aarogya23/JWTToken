export function ProgressBars({ items = [] }) {
  return (
    <div className="bars-card">
      {items.map((item) => (
        <div className="bar-row" key={item.label}>
          <div className="bar-meta">
            <span>{item.label}</span>
            <strong>{item.value}%</strong>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${item.value}%`, background: item.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PieProgress({ items = [] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 100;
  let cursor = 0;
  const stops = items
    .map((item) => {
      const start = (cursor / total) * 100;
      cursor += item.value;
      const end = (cursor / total) * 100;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="pie-layout">
      <div className="pie-chart" style={{ background: `conic-gradient(${stops})` }}>
        <div className="pie-center">
          <strong>{items[0]?.value ?? 0}%</strong>
          <span>done</span>
        </div>
      </div>
      <div className="pie-legend">
        {items.map((item) => (
          <div key={item.label} className="legend-item">
            <span className="legend-dot" style={{ background: item.color }} />
            <label>{item.label}</label>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
