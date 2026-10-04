import React from "react";
import { ArrowLeft } from "lucide-react";
import { useTenantConfig } from "@/config/tenantContext";
import { DEFAULT_POLICIES } from "@/config/tenantConfig";

export type LegalProps = { onBack: () => void };

const shell = "min-h-screen bg-[#faf9f7] dark:bg-[#0a0a0a] text-black dark:text-white px-4 pb-16 pt-24 sm:px-6 md:px-16 md:pb-32 md:pt-40 transition-colors duration-200";
const body = "whitespace-pre-line text-sm leading-8 text-black/60 dark:text-neutral-300";

function LegalLayout({
  title,
  date,
  children,
  onBack,
}: LegalProps & { title: React.ReactNode; date: string; children: React.ReactNode }) {
  return (
    <section className={shell}>
      <div className="mx-auto max-w-screen-xl">
        <button
          type="button"
          onClick={onBack}
          className="group mb-8 sm:mb-16 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 -ml-2.5 text-xs font-bold uppercase tracking-[0.18em] text-black/60 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 duration-200" />
          <span>Back</span>
        </button>
        <div className="grid gap-8 lg:gap-20 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="mb-4 sm:mb-6 text-[10px] font-semibold uppercase tracking-[0.45em] text-black/35 dark:text-neutral-500">
              Legal
            </p>
            <h1 className="text-[clamp(2.2rem,5vw,5.5rem)] font-extrabold leading-[0.95] tracking-tight text-black dark:text-white">
              {title}
            </h1>
            <p className="mt-6 sm:mt-8 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/35 dark:text-neutral-500">
              Last updated: {date}
            </p>
          </div>
          <div className="max-w-2xl space-y-8 sm:space-y-10 border-t border-black/15 dark:border-neutral-800 pt-8 lg:border-t-0 lg:pt-0">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function Blocks({ items }: { items: [string, string][] }) {
  return (
    <>
      {items.map(([heading, copy], idx) => (
        <div key={`${heading}-${idx}`} className="border-t border-black/10 dark:border-neutral-800 pt-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-black dark:text-white">
            {heading}
          </h2>
          <p className={body}>{copy}</p>
        </div>
      ))}
    </>
  );
}

export function TermsSection({ onBack }: LegalProps) {
  const { policies } = useTenantConfig();
  const policy = policies?.terms || DEFAULT_POLICIES.terms;
  const items: [string, string][] = (policy.sections || []).map((s) => [s.heading, s.body]);

  return (
    <LegalLayout
      title={policy.title || "Terms & Conditions"}
      date={policy.lastUpdated || "2 September 2026"}
      onBack={onBack}
    >
      {policy.intro && (
        <div className="space-y-3">
          {policy.intro.split("\n\n").map((para, i) => (
            <p key={i} className={i === 0 ? "text-lg leading-relaxed text-black/75 dark:text-neutral-200" : "text-sm leading-relaxed text-black/60 dark:text-neutral-400"}>
              {para}
            </p>
          ))}
        </div>
      )}
      <Blocks items={items} />
    </LegalLayout>
  );
}

export function OrdersShippingSection({ onBack }: LegalProps) {
  const { policies } = useTenantConfig();
  const policy = policies?.ordersShipping || DEFAULT_POLICIES.ordersShipping;
  const items: [string, string][] = (policy.sections || []).map((s) => [s.heading, s.body]);

  return (
    <LegalLayout
      title={policy.title || "Orders & Shipping"}
      date={policy.lastUpdated || "13 September 2026"}
      onBack={onBack}
    >
      {policy.intro && (
        <p className="text-lg leading-relaxed text-black/75 dark:text-neutral-200">
          {policy.intro}
        </p>
      )}
      <Blocks items={items} />
    </LegalLayout>
  );
}

export function PrivacyPolicySection({ onBack }: LegalProps) {
  const { policies } = useTenantConfig();
  const policy = policies?.privacy || DEFAULT_POLICIES.privacy;
  const items: [string, string][] = (policy.sections || []).map((s) => [s.heading, s.body]);

  return (
    <LegalLayout
      title={policy.title || "Privacy Policy"}
      date={policy.lastUpdated || "3 September 2026"}
      onBack={onBack}
    >
      {policy.intro && (
        <div className="space-y-3">
          {policy.intro.split("\n\n").map((para, i) => (
            <p key={i} className={i === 0 ? "text-lg leading-relaxed text-black/75 dark:text-neutral-200" : "text-sm leading-relaxed text-black/60 dark:text-neutral-400"}>
              {para}
            </p>
          ))}
        </div>
      )}
      <Blocks items={items} />
    </LegalLayout>
  );
}

export function RefundPolicySection({ onBack }: LegalProps) {
  const { policies } = useTenantConfig();
  const policy = policies?.refund || DEFAULT_POLICIES.refund;
  const items: [string, string][] = (policy.sections || []).map((s) => [s.heading, s.body]);

  return (
    <LegalLayout
      title={policy.title || "Return & Refund Policy"}
      date={policy.lastUpdated || "10 September 2026"}
      onBack={onBack}
    >
      {policy.intro && (
        <p className="text-lg leading-relaxed text-black/75 dark:text-neutral-200">
          {policy.intro}
        </p>
      )}
      <Blocks items={items} />
    </LegalLayout>
  );
}

export function CookiePolicySection({ onBack }: LegalProps) {
  const { policies } = useTenantConfig();
  const policy = policies?.cookies || DEFAULT_POLICIES.cookies;
  const items: [string, string][] = (policy.sections || []).map((s) => [s.heading, s.body]);

  return (
    <LegalLayout
      title={policy.title || "Cookie Policy"}
      date={policy.lastUpdated || "10 September 2026"}
      onBack={onBack}
    >
      {policy.intro && (
        <div className="space-y-3">
          {policy.intro.split("\n\n").map((para, i) => (
            <p key={i} className={i === 0 ? "text-lg leading-relaxed text-black/75 dark:text-neutral-200" : "text-sm leading-relaxed text-black/60 dark:text-neutral-400"}>
              {para}
            </p>
          ))}
        </div>
      )}
      <Blocks items={items} />
    </LegalLayout>
  );
}
