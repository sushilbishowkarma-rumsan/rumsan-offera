"use client";
// app/login/page.tsx
import { useLoginMutation } from "@/hooks/use-auth-mutations";
import { GoogleLogin } from "@react-oauth/google";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const loginMutation = useLoginMutation();

  return (
      <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{
        background:
          "linear-gradient(135deg, #0a0f2e 0%, #0d0a2e 25%, #1a0a2e 50%, #2d0a3e 75%, #1a0520 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Background Decorative Element: A soft orange blur */}
      <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-orange-100/50 blur-[120px] dark:bg-orange-900/20" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-orange-50/50 blur-[120px] dark:bg-slate-900/50" />

      <Card className="relative w-full max-w-md border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-2xl dark:border-slate-800 dark:bg-slate-900/80">
        <CardHeader className="space-y-2 text-center pt-8">
          <CardTitle className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
            Offera
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Welcome back! Please sign in to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center gap-6 pb-10">
          {/* A cleaner divider */}
          <div className="flex w-full items-center gap-2">
            <div className="h-[1px] grow bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              Secure Access
            </span>
            <div className="h-[1px] grow bg-slate-100 dark:bg-slate-800" />
          </div>

          <div className="relative z-10 flex w-full justify-center transition-transform hover:scale-[1.01] active:scale-[0.99]">
            <GoogleLogin
              theme="outline"
              size="large"
              shape="pill"
              width="320px"
              onSuccess={(res) => loginMutation.mutate(res.credential!)}
              onError={() => console.error("Login Failed")}
            />
          </div>

          {loginMutation.isPending && (
            <div className="flex items-center gap-2 text-sm font-medium text-orange-600 animate-in fade-in zoom-in-95">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Authenticating...</span>
            </div>
          )}

          {loginMutation.isError && (
            <p className="text-sm font-medium text-red-500 animate-bounce">
              Authentication failed. Please try again.
            </p>
          )}
        </CardContent>

        <div className="px-8 pb-8 text-center text-[11px] leading-relaxed text-slate-400">
          By continuing, you agree to the Offera{" "}
          <a
            href="/terms"
            className="font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-300"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-300"
          >
            Privacy Policy
          </a>
          .
        </div>
      </Card>
    </div>
  );
}
