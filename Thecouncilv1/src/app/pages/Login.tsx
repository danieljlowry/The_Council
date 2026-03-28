import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Eye, EyeOff, AlertCircle, X } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorState, setErrorState] = useState<"none" | "incomplete" | "incorrect">("none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim() || (!isLogin && !email.trim())) {
      setErrorState("incomplete");
      return;
    }

    if (isLogin) {
      // Mock login: accept "admin" / "admin"
      if (username === "admin" && password === "admin") {
        setErrorState("none");
        navigate("/");
      } else {
        setErrorState("incorrect");
      }
    } else {
      // Mock sign up: automatically log in for prototype purposes
      setErrorState("none");
      navigate("/");
    }
  };

  const closeModal = () => setErrorState("none");

  return (
    <div className="flex w-full h-screen bg-[#f8f9fa] items-center justify-center relative font-sans">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-[#002D72] -z-10" />
      <div className="absolute top-0 right-0 w-1/3 h-[40vh] bg-gradient-to-l from-[#007749]/20 to-transparent -z-10 mix-blend-overlay" />

      {/* Login Card */}
      <div className="w-full max-w-[420px] bg-white p-10 rounded-2xl shadow-xl border border-[#e5e5e5] flex flex-col items-center z-10 relative">
        <div className="w-14 h-14 rounded-xl bg-[#002D72] text-white flex items-center justify-center font-bold text-3xl mb-6 shadow-md shadow-[#002D72]/20">
          C
        </div>
        
        <div className="mb-8 text-center w-full flex flex-col items-center">
          <h1 className="text-2xl font-bold text-[#1e1e1e] mb-2">The Council</h1>
          <div className={`mt-2 py-2 px-5 rounded-full border shadow-sm transition-colors duration-300 ${isLogin ? 'bg-[#002D72]/10 border-[#002D72]/20' : 'bg-[#007749]/10 border-[#007749]/20'}`}>
            <p className={`text-lg font-bold tracking-wide transition-colors duration-300 ${isLogin ? 'text-[#002D72]' : 'text-[#007749]'}`}>
              {isLogin ? "Login" : "Create an Account"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1e1e1e]" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="py-2.5"
            />
          </div>

          {!isLogin && (
            <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
              <label className="text-sm font-medium text-[#1e1e1e]" htmlFor="email">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="py-2.5"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1e1e1e]" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="py-2.5 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#1e1e1e] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4 bg-[#002D72] hover:bg-[#001f50] text-white py-3 shadow-md shadow-[#002D72]/10 transition-colors" size="lg">
            {isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center w-full">
          <span className="text-sm text-[#757575]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorState("none");
                setUsername("");
                setEmail("");
                setPassword("");
              }}
              className="ml-2 font-medium text-[#007749] hover:underline transition-colors"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </span>
        </div>

        <div className="mt-8 text-center text-[11px] text-[#a3a3a3] uppercase tracking-widest font-medium">
          Authorized Personnel Only
        </div>
        
        {/* Prototype helper hint */}
        {isLogin && (
          <div className="mt-6 text-center text-[10px] text-[#007749]/70 bg-[#007749]/5 px-3 py-1.5 rounded border border-[#007749]/10">
            Prototype hint: Use <strong>admin</strong> / <strong>admin</strong>
          </div>
        )}
      </div>

      {/* Error Modals */}
      {errorState !== "none" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-[#e5e5e5] p-6 max-w-[340px] w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200 relative">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#1e1e1e] mb-2">
              {isLogin ? "Login Failed" : "Sign Up Failed"}
            </h3>
            <p className="text-sm text-[#757575] mb-6">
              {errorState === "incomplete" ? "Must complete all fields." : "Incorrect credentials."}
            </p>
            <Button onClick={closeModal} className="w-full bg-[#1e1e1e] hover:bg-black text-white py-2">
              Try Again
            </Button>
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-[#a3a3a3] hover:text-[#1e1e1e] transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
