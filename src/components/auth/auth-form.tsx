"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  loginSchema,
  signupSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type SignupValues,
} from "@/lib/auth/schemas";

function Field({
  label,
  error,
  type = "text",
  ...props
}: { label: string; error?: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
        {...props}
      />
      {error && <span className="block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{message}</p>;
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" disabled={loading} className="h-11 w-full bg-emerald-600 hover:bg-emerald-700">
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {loading ? "Please wait..." : children}
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setFormError(error.message === "Invalid login credentials" ? "Email or password is incorrect." : error.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FormError message={formError} />
      <Field label="Email" type="email" autoComplete="email" placeholder="you@company.com" {...form.register("email")} error={form.formState.errors.email?.message} />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <Link href="/forgot-password" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">Forgot password?</Link>
        </div>
        <input type="password" autoComplete="current-password" placeholder="Enter your password" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100" {...form.register("password")} />
        {form.formState.errors.password?.message && <span className="block text-xs font-medium text-red-600">{form.formState.errors.password.message}</span>}
      </div>
      <SubmitButton loading={form.formState.isSubmitting}>Sign in</SubmitButton>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<SignupValues>({ resolver: zodResolver(signupSchema), defaultValues: { loginId: "", email: "", password: "", confirmPassword: "" } });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    const { data: availability, error: availabilityError } = await supabase.rpc("is_login_id_available", { candidate: values.loginId });
    if (availabilityError) {
      setFormError("We could not verify that Login ID right now. Please try again.");
      return;
    }
    if (!availability) {
      setFormError("That Login ID is already in use.");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { login_id: values.loginId } },
    });
    if (error) {
      setFormError(error.message.toLowerCase().includes("duplicate") || error.message.toLowerCase().includes("unique") ? "That Login ID is already in use." : error.message);
      return;
    }
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    toast.success("Account created. Check your email to confirm your account.");
    router.replace("/login");
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FormError message={formError} />
      <Field label="Login ID" autoComplete="username" placeholder="your-login-id" {...form.register("loginId")} error={form.formState.errors.loginId?.message} />
      <Field label="Email" type="email" autoComplete="email" placeholder="you@company.com" {...form.register("email")} error={form.formState.errors.email?.message} />
      <Field label="Password" type="password" autoComplete="new-password" placeholder="At least 6 characters" {...form.register("password")} error={form.formState.errors.password?.message} />
      <Field label="Confirm Password" type="password" autoComplete="new-password" placeholder="Repeat your password" {...form.register("confirmPassword")} error={form.formState.errors.confirmPassword?.message} />
      <div className="pt-2"><SubmitButton loading={form.formState.isSubmitting}>Create account</SubmitButton></div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: `${window.location.origin}/login` });
    if (error) {
      setFormError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">If an account exists for that email, a password reset link is on its way. You can close this page or return to sign in.</div>;
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FormError message={formError} />
      <Field label="Email" type="email" autoComplete="email" placeholder="you@company.com" {...form.register("email")} error={form.formState.errors.email?.message} />
      <SubmitButton loading={form.formState.isSubmitting}>Send reset link</SubmitButton>
    </form>
  );
}
