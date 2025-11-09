// src/pages/Settings.jsx
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: "80px 24px 24px",
        maxWidth: 800,
        margin: "0 auto",
        color: "#fff",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#FFD700", marginBottom: 16 }}>
        User Settings
      </h1>

      <p style={{ marginBottom: 32, fontSize: 16, color: "#ccc" }}>
        Manage your account details and preferences.
      </p>

      <section
        style={{
          background: "#1a1a1a",
          border: "1px solid #FFD700",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#FFD700" }}>
          Profile
        </h2>
        <p><strong>Username:</strong> {user?.username || "Guest"}</p>
        <p><strong>Email:</strong> {user?.email || "N/A"}</p>

        {/* Go to Wallet Button */}
        <button
          onClick={() => navigate("/Wallet")}
          style={{
            marginTop: 16,
            background: "linear-gradient(90deg, #6a5acd, #1e90ff)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            padding: "10px 18px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          💰 Go to Wallet
        </button>
      </section>

      <section
        style={{
          background: "#1a1a1a",
          border: "1px solid #FFD700",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#FFD700" }}>
          Preferences
        </h2>
        <p style={{ color: "#ccc" }}>Coming soon: notification settings, theme options, etc.</p>
      </section>
    </div>
  );
}
