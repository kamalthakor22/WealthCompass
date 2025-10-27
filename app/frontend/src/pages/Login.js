import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Wallet, Lock, Mail, User, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
    } else {
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
      result = await register(formData.name, formData.email, formData.password);
    }

    setLoading(false);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container" data-testid="auth-page">
      <div className="auth-background"></div>
      <div className="auth-card" data-testid="auth-card">
        <div className="auth-header">
          <Wallet className="auth-logo" size={48} />
          <h1 className="auth-title">WealthCompass</h1>
          <p className="auth-subtitle">Secure Financial Tracking</p>
        </div>

        <div className="auth-toggle" data-testid="auth-toggle">
          <button
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
            data-testid="login-tab"
          >
            <LogIn size={18} /> Login
          </button>
          <button
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
            data-testid="register-tab"
          >
            <UserPlus size={18} /> Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" data-testid="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>
                <User size={18} /> Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={!isLogin}
                placeholder="Enter your name"
                data-testid="input-name"
              />
            </div>
          )}

          <div className="form-group">
            <label>
              <Mail size={18} /> Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter your email"
              data-testid="input-email"
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={18} /> Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter your password"
              minLength={6}
              data-testid="input-password"
            />
          </div>

          {error && (
            <div className="auth-error" data-testid="auth-error">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
            data-testid="submit-btn"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Register"}
          </Button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>
              Don't have an account?{" "}
              <span className="auth-link" onClick={() => setIsLogin(false)} data-testid="switch-to-register">
                Register here
              </span>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <span className="auth-link" onClick={() => setIsLogin(true)} data-testid="switch-to-login">
                Login here
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
