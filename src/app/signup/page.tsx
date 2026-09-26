import Link from "next/link";

import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <AuthLayout title="Create your workspace" description="Set up your secure StockSense account to get started." footer={<span>Already have an account? <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">Sign in</Link></span>}>
      <SignupForm />
    </AuthLayout>
  );
}
