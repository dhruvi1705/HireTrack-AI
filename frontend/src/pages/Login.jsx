import { useState } from "react";
import { BriefcaseBusiness, Lock, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await authService.login(email, password);

      navigate("/");
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        "Login failed. Please check your email and password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">

      <section className="login-card brutalist-card">

        <div className="login-brand">
          <div className="login-logo">
            <BriefcaseBusiness size={26} />
          </div>

          <div>
            <strong>HireTrack AI</strong>
            <span>Your career workspace</span>
          </div>
        </div>

        <div className="login-heading">
          <div className="eyebrow">
            Welcome back
          </div>

          <h1>
            Let's get back
            <br />
            to your <span>career.</span>
          </h1>

          <p>
            Sign in to continue tracking your job search.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">

          <label>
            Email

            <div className="login-input">
              <Mail size={18} />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                required
              />
            </div>
          </label>


          <label>
            Password

            <div className="login-input">
              <Lock size={18} />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
              />
            </div>
          </label>


          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}

            {!loading && <ArrowRight size={18} />}
          </button>

        </form>

      </section>

    </main>
  );
}