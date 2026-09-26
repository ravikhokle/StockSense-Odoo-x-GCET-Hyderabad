import { ArrowUpRight, BarChart3, Boxes } from "lucide-react";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">{eyebrow}</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
          Foundation phase <ArrowUpRight className="size-3.5" />
        </span>
      </div>
      <div className="grid gap-5 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Boxes className="size-6" strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-slate-900">Your workspace is ready</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">This area is connected to the StockSense navigation and ready for its operational workflow.</p>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/3 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400">Module setup will appear here</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8">
          <BarChart3 className="size-6 text-emerald-400" strokeWidth={1.8} />
          <p className="mt-8 text-sm font-semibold text-slate-300">StockSense foundation</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">A clear view of what moves.</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">Navigation, layout, and workspace structure are in place for the next phase.</p>
        </div>
      </div>
    </section>
  );
}
