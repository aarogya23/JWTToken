import AppShell from "../components/AppShell";

function flattenTests(workspace) {
  const tests = [];
  workspace.dashboard?.courses?.forEach((course) => {
    if (workspace.selectedCourseId === course.id && workspace.courseDetail?.assessments) {
      workspace.courseDetail.assessments.forEach((assessment) => {
        tests.push({ ...assessment, courseTitle: course.title, accentColor: course.accentColor });
      });
    }
  });
  return tests;
}

export default function TestsPage({ workspace, onSubmitAssessment }) {
  const { dashboard } = workspace;

  if (!dashboard) {
    return <div className="loading-screen">Loading test series...</div>;
  }

  const tests = flattenTests(workspace);

  return (
    <AppShell
      title="Test Series"
      subtitle="Track assessment readiness with a more focused exam workspace."
      actions={<input placeholder="Search test series" />}
      rightPanel={
        <>
          <p className="skill-section-label">RECENT SCORES</p>
          <div className="skill-stack">
            {dashboard.recentAttempts.map((attempt) => (
              <div key={`${attempt.assessmentTitle}-${attempt.submittedAt}`} className="skill-list-item">
                <strong>{attempt.assessmentTitle}</strong>
                <span>{attempt.percentage}%</span>
                <label>{new Date(attempt.submittedAt).toLocaleDateString()}</label>
              </div>
            ))}
          </div>
        </>
      }
    >
      <section className="page-grid">
        <article className="skill-card">
          <div className="skill-card-head">
            <p>ACTIVE TEST SERIES</p>
            <span>{tests.length} available now</span>
          </div>
          <div className="test-grid">
            {tests.map((assessment) => (
              <div key={assessment.id} className="skill-feature-card" style={{ borderLeftColor: assessment.accentColor }}>
                <strong>{assessment.title}</strong>
                <span>{assessment.courseTitle}</span>
                <label>{assessment.totalQuestions} questions · {assessment.timeLimitMinutes} min</label>
                <button
                  className="skill-plain-button solid"
                  onClick={() => {
                    const score = window.prompt("Enter mock score for this assessment", "84");
                    if (score) onSubmitAssessment(assessment.id, Number(score));
                  }}
                >
                  Submit score
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="skill-card">
          <div className="skill-card-head">
            <p>PERFORMANCE INSIGHT</p>
            <span>{dashboard.consistencyScore}% consistency</span>
          </div>
          <div className="skill-stack">
            <div className="skill-list-item">
              <strong>Completion rate</strong>
              <span>{dashboard.completionRate}% across active courses</span>
            </div>
            <div className="skill-list-item">
              <strong>Weekly momentum</strong>
              <span>{dashboard.weeklyProgress}% trend signal</span>
            </div>
            <div className="skill-list-item">
              <strong>Total XP</strong>
              <span>{dashboard.totalXp} academic points accumulated</span>
            </div>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
