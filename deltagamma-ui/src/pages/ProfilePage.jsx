import AppShell from "../components/AppShell";

export default function ProfilePage({ workspace, user }) {
  const { dashboard } = workspace;

  if (!dashboard || !user) {
    return <div className="loading-screen">Loading profile...</div>;
  }

  return (
    <AppShell
      title="Profile"
      subtitle="A full view of the learner profile, achievement data, and academic standing."
      actions={<input placeholder="Search profile insights" />}
      rightPanel={
        <>
          <p className="skill-section-label">PROFILE SUMMARY</p>
          <div className="skill-stack">
            <div className="skill-list-item">
              <strong>{user.fullName}</strong>
              <span>{user.email}</span>
              <label>{user.role}</label>
            </div>
            <div className="skill-list-item">
              <strong>Level {user.level}</strong>
              <span>{user.title}</span>
              <label>{user.streakDays} day streak</label>
            </div>
          </div>
        </>
      }
    >
      <section className="page-grid">
        <article className="skill-card">
          <div className="skill-card-head">
            <p>LEARNER IDENTITY</p>
            <span>Personal data</span>
          </div>
          <div className="profile-grid">
            <div className="skill-feature-card">
              <strong>Name</strong>
              <span>{user.fullName}</span>
            </div>
            <div className="skill-feature-card">
              <strong>Email</strong>
              <span>{user.email}</span>
            </div>
            <div className="skill-feature-card">
              <strong>Role</strong>
              <span>{user.role}</span>
            </div>
            <div className="skill-feature-card">
              <strong>Title</strong>
              <span>{user.title}</span>
            </div>
          </div>
        </article>

        <article className="skill-card">
          <div className="skill-card-head">
            <p>PERFORMANCE DATA</p>
            <span>All academic stats</span>
          </div>
          <div className="profile-grid">
            <div className="skill-feature-card">
              <strong>Total XP</strong>
              <span>{dashboard.totalXp}</span>
            </div>
            <div className="skill-feature-card">
              <strong>Weekly progress</strong>
              <span>{dashboard.weeklyProgress}%</span>
            </div>
            <div className="skill-feature-card">
              <strong>Completion rate</strong>
              <span>{dashboard.completionRate}%</span>
            </div>
            <div className="skill-feature-card">
              <strong>Consistency</strong>
              <span>{dashboard.consistencyScore}%</span>
            </div>
          </div>
        </article>

        <article className="skill-card">
          <div className="skill-card-head">
            <p>ACTIVE COURSES</p>
            <span>{dashboard.courses.length} tracked</span>
          </div>
          <div className="skill-stack">
            {dashboard.courses.map((course) => (
              <div key={course.id} className="skill-list-item">
                <strong>{course.title}</strong>
                <span>{course.progressPercent}% progress · {course.masteryPercent}% mastery</span>
                <label>{course.pointsEarned} points</label>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
