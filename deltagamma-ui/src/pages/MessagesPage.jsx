import { useState } from "react";
import AppShell from "../components/AppShell";

export default function MessagesPage({ workspace, onSendMessage }) {
  const { dashboard, selectedCourseId, setSelectedCourseId, courseDetail } = workspace;
  const [message, setMessage] = useState("");

  if (!dashboard) {
    return <div className="loading-screen">Loading messages...</div>;
  }

  return (
    <AppShell
      title="Messages"
      subtitle="Maintain focused teacher and instructor communication."
      actions={<input placeholder="Search conversation threads" />}
      rightPanel={
        <>
          <p className="skill-section-label">COURSE THREADS</p>
          <div className="skill-stack">
            {dashboard.courses.map((course) => (
              <button
                key={course.id}
                className={`skill-list-select ${selectedCourseId === course.id ? "selected" : ""}`}
                onClick={() => setSelectedCourseId(course.id)}
              >
                <strong>{course.title}</strong>
                <span>{course.mentorName}</span>
              </button>
            ))}
          </div>
        </>
      }
    >
      <section className="single-panel-page">
        <article className="skill-card">
          <div className="skill-card-head">
            <p>INSTRUCTOR CHANNEL</p>
            <span>{courseDetail?.course?.title || "Select a course"}</span>
          </div>
          <div className="message-thread">
            {courseDetail?.messages?.map((item) => (
              <div key={`${item.id}-${item.sentAt}`} className="message-bubble">
                <strong>{item.senderName}</strong>
                <span>{item.senderRole}</span>
                <p>{item.message}</p>
              </div>
            ))}
          </div>
          <div className="skill-message-compose">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a thoughtful question for your instructor"
            />
            <button
              className="skill-plain-button solid"
              onClick={async () => {
                if (!message.trim() || !selectedCourseId) return;
                await onSendMessage(selectedCourseId, message);
                setMessage("");
              }}
            >
              Send
            </button>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
