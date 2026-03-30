import AppShell from "../components/AppShell";

export default function CoursesPage({ workspace, onCompleteLesson }) {
  const { dashboard, selectedCourseId, setSelectedCourseId, courseDetail } = workspace;

  if (!dashboard) {
    return <div className="loading-screen">Loading courses...</div>;
  }

  return (
    <AppShell
      title="Courses"
      subtitle="Explore structured learning paths and drill into every lesson."
      actions={<input placeholder="Filter courses by title or category" />}
      rightPanel={
        <>
          <p className="skill-section-label">COURSE METRICS</p>
          <div className="skill-stack">
            {dashboard.courses.map((course) => (
              <div key={course.id} className="skill-list-item">
                <strong>{course.title}</strong>
                <span>{course.category} · {course.estimatedHours} hours</span>
                <label>{course.lessonCount} lessons · {course.assessmentCount} tests</label>
              </div>
            ))}
          </div>
        </>
      }
    >
      <section className="page-grid">
        <article className="skill-card">
          <div className="skill-card-head">
            <p>COURSE SERIES</p>
            <span>{dashboard.courses.length} tracks active</span>
          </div>
          <div className="skill-stack">
            {dashboard.courses.map((course) => (
              <button
                key={course.id}
                className={`skill-list-select ${selectedCourseId === course.id ? "selected" : ""}`}
                onClick={() => setSelectedCourseId(course.id)}
              >
                <strong>{course.title}</strong>
                <span>{course.tagline}</span>
                <label>{course.progressPercent}% progress · {course.pointsEarned} pts</label>
              </button>
            ))}
          </div>
        </article>

        <article className="skill-card">
          <div className="skill-card-head">
            <p>COURSE DETAIL</p>
            <button className="skill-plain-button" onClick={() => onCompleteLesson(selectedCourseId)}>
              Complete next lesson
            </button>
          </div>
          {courseDetail ? (
            <div className="skill-stack">
              <div className="skill-feature-card">
                <strong>{courseDetail.course.title}</strong>
                <span>{courseDetail.course.tagline}</span>
                <label>{courseDetail.course.category} · {courseDetail.course.difficultyLevel}</label>
              </div>
              {courseDetail.lessons.map((lesson) => (
                <div key={lesson.id} className="skill-list-item">
                  <strong>{lesson.sequenceOrder}. {lesson.title}</strong>
                  <span>{lesson.topic}</span>
                  <label>{lesson.durationMinutes} minutes</label>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Select a course to view the learning path.</div>
          )}
        </article>
      </section>
    </AppShell>
  );
}
