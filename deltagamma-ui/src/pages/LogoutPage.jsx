import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LogoutPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    const timer = setTimeout(() => navigate("/login", { replace: true }), 800);
    return () => clearTimeout(timer);
  }, [logout, navigate]);

  return (
    <div className="logout-screen">
      <div className="logout-card">
        <strong>Signing you out</strong>
        <p>Your DeltaGamma workspace is being closed securely.</p>
      </div>
    </div>
  );
}
