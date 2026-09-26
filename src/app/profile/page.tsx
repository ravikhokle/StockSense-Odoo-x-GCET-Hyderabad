import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const name = typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim() ? user.user_metadata.name : user.email?.split("@")[0] ?? "Account owner";
  return <section className="mx-auto max-w-5xl"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Account</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Profile</h1><p className="mt-2 text-sm text-slate-500">Manage the identity details used across your workspace.</p></div><div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-base font-bold text-slate-900">Personal details</h2><p className="mt-1 text-sm text-slate-500">Email changes require a separate confirmation flow and remain read-only here.</p><div className="mt-6"><ProfileForm userId={user.id} name={name} /></div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-base font-bold text-slate-900">Account information</h2><dl className="mt-6 space-y-5"><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Email</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{user.email ?? "-"}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Account created</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(user.created_at))}</dd></div></dl></div></div></section>;
}
