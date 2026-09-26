import Link from "next/link";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" description="Sign in to continue managing your inventory network." footer={<span>New to StockSense? <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">Create an account</Link></span>}>
      <LoginForm />
    </AuthLayout>
  );
}
