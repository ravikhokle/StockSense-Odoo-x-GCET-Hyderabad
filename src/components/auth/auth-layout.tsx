import Link from "next/link";
import { Boxes, ShieldCheck } from "lucide-react";

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9f8] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 size-96 rounded-full bg-amber-100/60 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
          <Link href="/login" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500">
              <Boxes className="size-5" strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">StockSense</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Inventory OS</span>
            </span>
          </Link>
          <div>
            <p className="max-w-xs text-3xl font-bold leading-tight tracking-tight">A clearer view of what moves.</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">Bring your operations, locations, and inventory network into one calm workspace.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <ShieldCheck className="size-4 text-emerald-400" /> Secure workspace access
          </div>
        </div>
        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mb-8 lg:hidden">
            <Link href="/login" className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Boxes className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-950">StockSense</span>
            </Link>
          </div>
          <div className="mx-auto max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Welcome to StockSense</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-7 text-center text-sm text-slate-500">{footer}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
