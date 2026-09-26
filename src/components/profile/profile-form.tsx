"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { profileSchema, type ProfileFormValues } from "@/lib/profile/schemas";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({ name }: { userId: string; name: string }) {
  const router = useRouter(); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: { name } });
  async function submit(values: ProfileFormValues) {
    setError(null); setSaved(false); const supabase = createClient();
    const { error: userError } = await supabase.auth.updateUser({ data: { name: values.name } });
    if (userError) { setError(userError.message); return; }
    window.dispatchEvent(new CustomEvent("stocksense-profile-name-updated", { detail: values.name }));
    setSaved(true); router.refresh();
  }
  return <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>{error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}{saved && <p role="status" className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">Profile updated.</p>}<label className="block space-y-1.5"><span className="text-xs font-bold text-slate-600">Name</span><input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" {...form.register("name")} />{form.formState.errors.name?.message && <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>}</label><button type="submit" disabled={form.formState.isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{form.formState.isSubmitting && <LoaderCircle className="size-4 animate-spin" />}Save changes</button></form>;
}