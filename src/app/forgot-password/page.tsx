import Link from "next/link";

import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/auth-form";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Reset your password" description="Enter your account email and we will send you a secure reset link." footer={<Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">Back to sign in</Link>}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
