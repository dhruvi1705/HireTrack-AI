import { useEffect, useState } from "react";
import { BriefcaseBusiness, Lock, Mail, ArrowRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Login.css";

export default function Login({ isSignUpMode = false }) {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(isSignUpMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await authService.register(fullName, email, password);
        await authService.login(email, password);
      } else {
        await authService.login(email, password);
      }

      navigate("/dashboard");
    } catch (err) {
      let message = err.response?.data?.detail;

      if (Array.isArray(message)) {
        message = message.map((item) => item.msg).join(", ");
      }

      if (!message) {
        message = isSignUp
          ? "Registration failed. Please check your details."
          : "Login failed. Please check your email and password.";
      }

      setError(typeof message === "string" ? message : JSON.stringify(message));
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
            {isSignUp ? "Get started" : "Welcome back"}
          </div>

          <h1>
            {isSignUp ? (
              <>
                Start tracking
                <br />
                your <span>career.</span>
              </>
            ) : (
              <>
                Let's get back
                <br />
                to your <span>career.</span>
              </>
            )}
          </h1>

          <p>
            {isSignUp
              ? "Create an account to continue tracking your job search."
              : "Sign in to continue tracking your job search."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">

          {isSignUp && (
            <label>
              Full Name

              <div className="login-input">
                <User size={18} />

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Dhruvi Khatri"
                  required
                />
              </div>
            </label>
          )}

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
                placeholder={isSignUp ? "Create a secure password (min 8 chars)" : "Enter your password"}
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
            {loading
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
              ? "Create account"
              : "Sign in"}

            {!loading && <ArrowRight size={18} />}
          </button>

          <div className="login-toggle-prompt">
            {isSignUp ? (
              <>
                Already have an account?
                <button
                  type="button"
                  className="login-toggle-btn"
                  onClick={() => {
                    setIsSignUp(false);
                    setError("");
                  }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?
                <button
                  type="button"
                  className="login-toggle-btn"
                  onClick={() => {
                    setIsSignUp(true);
                    setError("");
                  }}
                >
                  Sign up
                </button>
              </>
            )}
          </div>

        </form>

      </section>

    </main>
  );
}