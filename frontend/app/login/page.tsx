"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { createClient } from "@/utils/supabase/client";

type ErrorState = "none" | "incomplete" | "auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorState, setErrorState] = useState<ErrorState>("none");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedEmail || !password.trim() || (!isLogin && !trimmedUsername)) {
      setErrorState("incomplete");
      setErrorMessage(
        isLogin
          ? "Email and password are required."
          : "Username, email, and password are required.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorState("none");
    setErrorMessage("");

    const supabase = createClient();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
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
      email: trimmedEmail,
      password,
      options: {
        data: {
          username: trimmedUsername,
          full_name: trimmedFullName || undefined,
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
      setInfoMessage("Check your email for a confirmation link, then sign in here.");
      setIsSubmitting(false);
      setIsLogin(true);
      setUsername("");
      setFullName("");
      setPassword("");
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
    <div className="relative flex h-screen w-full items-center justify-center bg-[#f8f9fa] font-sans">
      <div className="absolute top-0 left-0 -z-10 h-[40vh] w-full bg-[#002D72]" />
      <div className="absolute top-0 right-0 -z-10 h-[40vh] w-1/3 bg-gradient-to-l from-[#007749]/20 to-transparent mix-blend-overlay" />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center rounded-2xl border border-[#e5e5e5] bg-white p-10 shadow-xl">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#002D72] text-3xl font-bold text-white shadow-md shadow-[#002D72]/20">
          C
        </div>

        <div className="mb-8 flex w-full flex-col items-center text-center">
          <h1 className="mb-2 text-2xl font-bold text-[#1e1e1e]">The Council</h1>
          <div
            className={`mt-2 rounded-full border px-5 py-2 shadow-sm transition-colors duration-300 ${
              isLogin
                ? "border-[#002D72]/20 bg-[#002D72]/10"
                : "border-[#007749]/20 bg-[#007749]/10"
            }`}
          >
            <p
              className={`text-lg font-bold tracking-wide transition-colors duration-300 ${
                isLogin ? "text-[#002D72]" : "text-[#007749]"
              }`}
            >
              {isLogin ? "Login" : "Create an Account"}
            </p>
          </div>
        </div>

        {infoMessage && (
          <div className="mb-4 w-full rounded-lg border border-[#007749]/30 bg-[#007749]/10 px-3 py-2 text-center text-sm text-[#1e1e1e]">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
          {!isLogin && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1e1e1e]" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="py-2.5"
                  autoComplete="username"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1e1e1e]" htmlFor="fullName">
                  Full name <span className="font-normal text-[#757575]">(optional)</span>
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
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1e1e1e]" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-2.5"
              autoComplete="email"
            />
          </div>

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
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#757575] transition-colors hover:text-[#1e1e1e]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full bg-[#002D72] py-3 text-white shadow-md shadow-[#002D72]/10 transition-colors hover:bg-[#001f50]"
            size="lg"
          >
            {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Create account"}
          </Button>
        </form>

        <div className="mt-6 flex w-full items-center justify-center">
          <span className="text-sm text-[#757575]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin((prev) => !prev);
                setUsername("");
                setFullName("");
                setEmail("");
                setPassword("");
                setShowPassword(false);
                setInfoMessage(null);
                setIsSubmitting(false);
                closeModal();
              }}
              className="ml-2 font-medium text-[#007749] transition-colors hover:underline"
              type="button"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </span>
        </div>

        <div className="mt-8 text-center text-[11px] font-medium uppercase tracking-widest text-[#a3a3a3]">
          Sign in with your Supabase account
        </div>
      </div>

      {errorState !== "none" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex w-full max-w-[340px] flex-col items-center rounded-xl border border-[#e5e5e5] bg-white p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle size={24} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#1e1e1e]">
              {isLogin ? "Login Failed" : "Sign Up Failed"}
            </h3>
            <p className="mb-6 text-sm text-[#757575]">
              {errorState === "incomplete"
                ? errorMessage || "Please complete all required fields."
                : errorMessage || "Something went wrong. Try again."}
            </p>
            <Button
              onClick={closeModal}
              className="w-full bg-[#1e1e1e] py-2 text-white hover:bg-black"
            >
              Try Again
            </Button>
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[#a3a3a3] transition-colors hover:text-[#1e1e1e]"
              aria-label="Close"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
