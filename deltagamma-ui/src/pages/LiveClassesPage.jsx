import AppShell from "../components/AppShell";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function LiveClassesPage({ workspace, onJoinLiveClass }) {
  const { dashboard, presenceFeed } = workspace;

  if (!dashboard) {
    return <div className="loading-screen">Loading live classes...</div>;
  }

  return (
    <AppShell
      title="Live Classes"
      subtitle="Join upcoming sessions and watch live participation update in real time."
      actions={<input placeholder="Find live sessions" />}
      rightPanel={
        <>
          <p className="skill-section-label">LIVE PRESENCE</p>
          <div className="skill-stack">
            {presenceFeed.map((entry, index) => (
              <div key={`${entry.userId}-${index}`} className="skill-activity-item">
                <div className="skill-activity-line" />
                <div>
                  <p><strong>{entry.name}</strong> joined live</p>
                  <span>{entry.role} · {formatDate(entry.joinedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      }
    >
      <section className="test-grid">
        {dashboard.liveClasses.map((liveClass) => (
          <article key={liveClass.id} className="skill-card">
            <div className="skill-card-head">
              <p>LIVE CLASS</p>
              <span>{liveClass.meetingCode}</span>
            </div>
            <div className="skill-stack">
              <div className="skill-feature-card">
                <strong>{liveClass.title}</strong>
                <span>{liveClass.courseTitle}</span>
                <label>{liveClass.instructorName}</label>
              </div>
              <div className="skill-list-item">
                <strong>Scheduled for</strong>
                <span>{formatDate(liveClass.scheduledFor)}</span>
                <label>{liveClass.durationMinutes} minutes</label>
              </div>
              <button className="skill-plain-button solid" onClick={() => onJoinLiveClass(liveClass.id)}>
                Join live class
              </button>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
