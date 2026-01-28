/**
 * 🔐 LOGIN PAGE - User Authentication
 *
 * LEARNING: Form Handling in React
 * - useState for form data management
 * - Event handlers for user input
 * - API calls with axios
 * - Error handling and loading states
 * - Navigation with React Router
 */

import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useAuth } from "../contexts/AuthContext";
import { Sprout } from "lucide-react";

/**
 * LOGIN COMPONENT
 *
 * Allows users to sign in to their account
 */
export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorType(null);

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate("/chat");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Login failed. Please try again.";
      const errorCategory = err.response?.data?.errorType || null;
      
      setError(errorMessage);
      setErrorType(errorCategory);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-grass-200 dark:bg-grass-900/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-oak-200 dark:bg-oak-900/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      {/* Mock Account Info */}
      <div className="absolute top-10 left-10 bg-nature-stone/20 dark:bg-nature-bark/30 backdrop-blur-sm border-2 border-nature-bark/20 dark:border-nature-stone/20 rounded-xl p-10  shadow-lg">
        <p className="font-pixel text-m text-black dark:text-nature-stone leading-relaxed">
          <span className="block mb-2 text-m">Test Account</span>
          <span className="block">Email: testing@test.com</span>
          <span className="block">Password: 12345689</span>
        </p>
      </div>
      
      <Card className="w-full max-w-md animate-pop-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-grass-100 dark:bg-grass-900/30 rounded-2xl mb-4 animate-bounce-gentle">
            <Sprout className="text-grass-600 dark:text-grass-400" size={32} />
          </div>
          <h1 className="text-2xl font-pixel text-gradient-nature mb-2">
            ChatWave
          </h1>
          <p className="text-nature-bark dark:text-nature-stone font-sans">
            Welcome back! 🌿
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl animate-wiggle">
              <p className="text-red-600 dark:text-red-400 text-sm font-sans font-semibold mb-1">
                {error}
              </p>
              
              {/* Helpful suggestions based on error type */}
              {errorType === "EMAIL_NOT_FOUND" && (
                <p className="text-red-500 dark:text-red-300 text-xs font-sans mt-2">
                  💡 Tip: Double-check your email or{" "}
                  <Link to="/register" className="underline font-semibold">
                    create an account
                  </Link>
                </p>
              )}
              
              {errorType === "INVALID_PASSWORD" && (
                <p className="text-red-500 dark:text-red-300 text-xs font-sans mt-2">
                  💡 Tip: Check Caps Lock or{" "}
                  <Link to="/forgot-password" className="underline font-semibold">
                    reset your password
                  </Link>
                </p>
              )}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="leaf@nature.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />

          {/* Forgot password */}
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm dark:text-grass-400 hover:underline font-sans"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "🌱 Logging in..." : "🌿 Log In"}
          </Button>

          <p className="text-center text-sm text-nature-bark dark:text-nature-stone font-sans">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-grass-600 dark:text-grass-400 hover:underline font-semibold"
            >
              Sign up here
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
