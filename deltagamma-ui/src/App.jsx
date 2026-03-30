import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useAcademyWorkspace } from "./data/useAcademyWorkspace";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CoursesPage from "./pages/CoursesPage";
import TestsPage from "./pages/TestsPage";
import MessagesPage from "./pages/MessagesPage";
import LiveClassesPage from "./pages/LiveClassesPage";
import ProfilePage from "./pages/ProfilePage";
import LogoutPage from "./pages/LogoutPage";

export default function App() {
  const { user, loading, setUser } = useAuth();
  const workspace = useAcademyWorkspace(user, setUser);

  if (loading) {
    return <div className="loading-screen">Preparing workspace...</div>;
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<Navigate to="/" replace />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route
        path="/"
        element={
          user ? (
            <DashboardPage
              workspace={workspace}
              user={user}
              onCompleteLesson={workspace.completeLesson}
              onJoinLiveClass={workspace.joinLiveClass}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/courses"
        element={user ? <CoursesPage workspace={workspace} onCompleteLesson={workspace.completeLesson} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/tests"
        element={user ? <TestsPage workspace={workspace} onSubmitAssessment={workspace.submitAssessment} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/messages"
        element={user ? <MessagesPage workspace={workspace} onSendMessage={workspace.sendMessage} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/live"
        element={user ? <LiveClassesPage workspace={workspace} onJoinLiveClass={workspace.joinLiveClass} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={user ? <ProfilePage workspace={workspace} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route path="/logout" element={<LogoutPage />} />
    </Routes>
  );
}
