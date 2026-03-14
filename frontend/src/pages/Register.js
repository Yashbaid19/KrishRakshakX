import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    state: "",
    district: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      
      if (response.data && response.data.token) {
        toast.success("Registration successful!");
        // Store token and redirect
        localStorage.setItem("token", response.data.token);
        onLogin(response.data.token);
      } else {
        throw new Error("No token received");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.detail || error.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Sprout className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">KrishiRakshak X</h1>
          <p className="text-muted-foreground">Join the smart farming revolution</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Create Account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                data-testid="register-name-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="rounded-lg border-emerald-200 focus:ring-2 focus:ring-emerald-500 mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                data-testid="register-email-input"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="farmer@example.com"
                className="rounded-lg border-emerald-200 focus:ring-2 focus:ring-emerald-500 mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                data-testid="register-password-input"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="rounded-lg border-emerald-200 focus:ring-2 focus:ring-emerald-500 mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                data-testid="register-phone-input"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="rounded-lg border-emerald-200 focus:ring-2 focus:ring-emerald-500 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  data-testid="register-state-input"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Punjab"
                  className="rounded-lg border-emerald-200 focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  name="district"
                  data-testid="register-district-input"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Ludhiana"
                  className="rounded-lg border-emerald-200 focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
            </div>

            <Button
              data-testid="register-submit-button"
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg py-6 text-lg font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                data-testid="go-to-login-link"
                className="text-primary font-medium hover:underline"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}