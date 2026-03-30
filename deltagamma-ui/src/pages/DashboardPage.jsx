import AppShell from "../components/AppShell";
import { PieProgress, ProgressBars } from "../components/Charts";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const weekMap = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];

export default function DashboardPage({
  workspace,
  user,
  onCompleteLesson,
  onJoinLiveClass,
}) {
  const { dashboard, selectedCourseId, setSelectedCourseId, courseDetail, presenceFeed } = workspace;

  if (!dashboard || !user) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  const studyData = weekMap.map((day, index) => ({
    day,
    value: dashboard.barSeries[index % dashboard.barSeries.length]?.value ?? 40,
  }));

  return (
    <AppShell
      title="Dashboard"
      subtitle={`${user.fullName} is tracking live academic momentum.`}
      actions={
        <>
          <input placeholder="Search courses, tests, live classes" />
          <button>🔔</button>
          <button>⚙</button>
        </>
      }
      rightPanel={
        <>
          <p className="skill-section-label">LIVE EVENTS</p>
          {dashboard.liveClasses.map((liveClass) => (
            <div key={liveClass.id} className="skill-live-card">
              <span>Live</span>
              <strong>{liveClass.title}</strong>
              <p>{liveClass.courseTitle}</p>
              <label>{formatDate(liveClass.scheduledFor)}</label>
              <button className="skill-plain-button solid" onClick={() => onJoinLiveClass(liveClass.id)}>
                Join class
              </button>
            </div>
          ))}

          <p className="skill-section-label top-gap">ACTIVITY</p>
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

          <div className="skill-right-footer">
            <p className="skill-section-label">PROGRESS SNAPSHOT</p>
            <ProgressBars items={dashboard.barSeries} />
          </div>
        </>
      }
    >
      <section className="skill-section">
        <p className="skill-section-label">OVERVIEW</p>
        <div className="skill-stat-grid">
          <article className="skill-stat-card">
            <span>Courses in progress</span>
            <strong>{dashboard.courses.length}</strong>
          </article>
          <article className="skill-stat-card">
            <span>Active test series</span>
            <strong>{courseDetail?.assessments?.length ?? 0}</strong>
          </article>
          <article className="skill-stat-card">
            <span>Weekly progress</span>
            <strong>{dashboard.weeklyProgress}%</strong>
          </article>
          <article className="skill-stat-card">
            <span>Total score</span>
            <strong>{dashboard.totalXp}</strong>
          </article>
        </div>
      </section>

      <section className="skill-chart-row">
        <article className="skill-card skill-study-card">
          <div className="skill-card-head">
            <p>STUDY STATISTICS</p>
            <span>week | <strong>month</strong></span>
          </div>
          <div className="skill-bars">
            {studyData.map((item, index) => (
              <div key={item.day} className="skill-bar-column">
                <div
                  className={`skill-bar ${index === 4 ? "accent" : ""}`}
                  style={{ height: `${Math.max(18, item.value)}%` }}
                />
                <label>{item.day}</label>
              </div>
            ))}
          </div>
        </article>

        <article className="skill-card skill-progress-card">
          <p>PROGRESS</p>
          <PieProgress items={dashboard.pieSeries} />
        </article>
      </section>

      <section className="skill-section">
        <p className="skill-section-label">MY COURSES</p>
        <div className="skill-course-row">
          {dashboard.courses.map((course) => (
            <button
              key={course.id}
              className={`skill-course-card ${selectedCourseId === course.id ? "selected" : ""}`}
              style={{ "--accent": course.accentColor }}
              onClick={() => setSelectedCourseId(course.id)}
            >
              <div className="skill-course-head">
                <span>{course.title}</span>
                <strong>⋮</strong>
              </div>
              <p>{course.mentorName}</p>
              <div className="skill-ring-wrap">
                <svg viewBox="0 0 36 36" className="skill-ring">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#dbe7f5"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={course.accentColor}
                    strokeWidth="3"
                    strokeDasharray={`${course.progressPercent}, 100`}
                  />
                </svg>
                <div>{course.progressPercent}%</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="skill-detail-grid">
        <article className="skill-card">
          <div className="skill-card-head">
            <p>LESSONS</p>
            <button className="skill-plain-button" onClick={() => onCompleteLesson(selectedCourseId)}>
              Complete next
            </button>
          </div>
          <div className="skill-stack">
            {courseDetail?.lessons?.map((lesson) => (
              <div key={lesson.id} className="skill-list-item">
                <strong>{lesson.sequenceOrder}. {lesson.title}</strong>
                <span>{lesson.topic}</span>
                <label>{lesson.durationMinutes} min</label>
              </div>
            ))}
          </div>
        </article>

        <article className="skill-card">
          <div className="skill-card-head">
            <p>RECENT TESTS</p>
            <span>{dashboard.completionRate}% completion</span>
          </div>
          <div className="skill-stack">
            {dashboard.recentAttempts.map((attempt) => (
              <div key={`${attempt.assessmentTitle}-${attempt.submittedAt}`} className="skill-list-item">
                <strong>{attempt.assessmentTitle}</strong>
                <span>{attempt.percentage}% score</span>
                <label>{formatDate(attempt.submittedAt)}</label>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
