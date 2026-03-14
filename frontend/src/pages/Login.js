import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Login({ onLogin }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================
  // Normal Email Login
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });

      if (response.data?.token) {

        localStorage.setItem("token", response.data.token);
        toast.success("Login successful!");

        onLogin(response.data.token);

      } else {
        throw new Error("Token not received");
      }

    } catch (error) {

      console.error(error);

      toast.error(
        error.response?.data?.detail ||
        error.message ||
        "Login failed"
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================
  // Google Login
  // ==========================
  const handleGoogleLogin = async (credentialResponse) => {

    try {

      const response = await axios.post(`${API}/auth/google`, {
        token: credentialResponse.credential
      });

      if (response.data?.token) {

        localStorage.setItem("token", response.data.token);
        toast.success("Google login successful!");

        onLogin(response.data.token);

      } else {
        throw new Error("Google login failed");
      }

    } catch (error) {

      console.error("Google login error:", error);

      toast.error(
        error.response?.data?.detail ||
        "Google login failed"
      );
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Sprout className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-primary mb-2">
            KrishiRakshak X
          </h1>

          <p className="text-muted-foreground">
            AI-powered smart farming platform
          </p>

        </div>


        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">

          <h2 className="text-2xl font-semibold mb-6 text-center">
            Welcome Back
          </h2>


          {/* Email Login */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>

              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="farmer@example.com"
                className="rounded-lg border-emerald-200 mt-1"
                required
              />

            </div>


            <div>

              <Label htmlFor="password">Password</Label>

              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border-emerald-200 mt-1"
                required
              />

            </div>


            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary hover:bg-primary/90 py-6 text-lg"
            >

              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}

            </Button>

          </form>


          {/* Divider */}
          <div className="flex items-center my-6">

            <div className="flex-grow border-t"></div>

            <span className="px-3 text-sm text-gray-500">
              OR
            </span>

            <div className="flex-grow border-t"></div>

          </div>


          {/* Google Login */}
          <div className="flex justify-center">

            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={()=>toast.error("Google Login Failed")}
            />

          </div>


          {/* Register Link */}
          <div className="mt-6 text-center">

            <p className="text-sm text-muted-foreground">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                Register here
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}