"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Eye, EyeOff, AlertCircle, X } from "lucide-react";

export function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorState, setErrorState] = useState<"none" | "incomplete" | "auth">(
    "none",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorState("incomplete");
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorState("none");
    setErrorMessage("");

    const supabase = createClient();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorState("auth");
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim() || undefined,
        },
      },
    });

    if (error) {
      setErrorState("auth");
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (data.user && !data.session) {
      setInfoMessage(
        "Check your email for a confirmation link, then sign in here.",
      );
      setIsSubmitting(false);
      setIsLogin(true);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setIsSubmitting(false);
  };

  const closeModal = () => {
    setErrorState("none");
    setErrorMessage("");
  };

  return (
    <div className="flex w-full h-screen bg-background items-center justify-center relative font-sans transition-colors">
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-[#002D72] dark:bg-[#31435a] -z-10 transition-colors" />
      <div className="absolute top-0 right-0 w-1/3 h-[40vh] bg-gradient-to-l from-[#007749]/20 to-transparent dark:from-[#9ab5ff]/12 -z-10 mix-blend-overlay" />

      <div className="w-full max-w-[420px] bg-card p-10 rounded-2xl shadow-xl border border-border flex flex-col items-center z-10 relative transition-colors">
        <div className="w-14 h-14 rounded-xl bg-[#002D72] text-white flex items-center justify-center font-bold text-3xl mb-6 shadow-md shadow-[#002D72]/20">
          C
        </div>

        <div className="mb-8 text-center w-full flex flex-col items-center">
          <h1 className="text-2xl font-bold text-card-foreground mb-2">The Council</h1>
          <div
            className={`mt-2 py-2 px-5 rounded-full border shadow-sm transition-colors duration-300 ${isLogin ? "bg-[#002D72]/10 border-[#002D72]/20" : "bg-[#007749]/10 border-[#007749]/20"}`}
          >
            <p
              className={`text-lg font-bold tracking-wide transition-colors duration-300 ${isLogin ? "text-[#002D72]" : "text-[#007749]"}`}
            >
              {isLogin ? "Login" : "Create an Account"}
            </p>
          </div>
        </div>

        {infoMessage && (
          <div className="mb-4 w-full rounded-lg border border-[#007749]/30 bg-[#007749]/10 px-3 py-2 text-center text-sm text-foreground">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          {!isLogin && (
            <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="fullName"
              >
                Full name <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Display name for your profile"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="py-2.5"
                autoComplete="name"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-2.5"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
                className="text-sm font-medium text-foreground"
              htmlFor="password"
            >
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
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 bg-[#002D72] hover:bg-[#001f50] text-white py-3 shadow-md shadow-[#002D72]/10 transition-colors disabled:opacity-60"
            size="lg"
          >
            {isSubmitting
              ? "Please wait…"
              : isLogin
                ? "Login"
                : "Create account"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center w-full">
          <span className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorState("none");
                setErrorMessage("");
                setInfoMessage(null);
                setFullName("");
                setPassword("");
              }}
              className="ml-2 font-medium text-[#007749] hover:underline transition-colors"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </span>
        </div>

        <div className="mt-8 text-center text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
          Sign in with your Supabase account
        </div>
      </div>

      {errorState !== "none" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-[340px] w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200 relative">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-card-foreground mb-2">
              {isLogin ? "Login Failed" : "Sign Up Failed"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 break-words px-1">
              {errorState === "incomplete"
                ? errorMessage || "Please complete all required fields."
                : errorMessage || "Something went wrong. Try again."}
            </p>
            <Button
              onClick={closeModal}
              className="w-full bg-foreground hover:bg-foreground/90 text-background py-2"
            >
              Try Again
            </Button>
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
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
