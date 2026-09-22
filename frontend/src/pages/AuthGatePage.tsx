import { AuthForm } from "../components/AuthForm";
import { CedarMark } from "../components/CedarMark";

export default function AuthGatePage() {
  return (
    <div className="night-watch relative min-h-dvh overflow-x-hidden text-[#fff8e7]">
      <div className="night-stars pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex flex-col justify-between px-5 py-6 sm:px-10 sm:py-10">
          <div className="flex items-center gap-3">
            <CedarMark className="h-11 w-11 shrink-0" />
            <div>
              <p className="font-display text-xl leading-none">CedarWatch</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#d4a017]">
                Lebanon lookout
              </p>
            </div>
          </div>

          <div className="relative my-8 max-w-md lg:my-0">
            <CedarSilhouette />
            <p
              className="font-arabic mt-3 w-fit text-4xl leading-[1.05] text-[#d4a017] sm:text-6xl"
              dir="rtl"
              lang="ar"
            >
              مرصد الأرز
            </p>
            <h1 className="font-display mt-4 text-4xl leading-[1.05] sm:text-6xl">
              Hold the night
              <span className="italic text-[#d4a017]"> with your street.</span>
            </h1>
            <p className="mt-4 text-sm text-[#f3ead6]/75 sm:text-base">
              Electricity, internet, water — pin what went dark. Neighbors confirm
              it. This is a lookout, not a dashboard product.
            </p>
            <p
              className="font-arabic mt-3 w-fit text-sm text-[#f3ead6]/75 sm:text-base"
              dir="rtl"
              lang="ar"
            >
              من رأى انطفاء النور؟
            </p>
          </div>

          <p className="hidden text-[11px] uppercase tracking-[0.2em] text-[#d4a017]/70 lg:block">
            Shift open{" "}
            <span className="font-arabic normal-case tracking-normal" dir="ltr" lang="ar">
              · بيروت · طرابلس · صيدا · زحلة
            </span>
          </p>
        </section>

        <section className="flex items-end px-4 pb-6 sm:items-center sm:px-8 sm:pb-10 lg:pr-10">
          <div className="gate-ticket w-full p-5 ps-6 sm:p-7 sm:ps-8">
            <p className="stamp text-[var(--cedar-green)]">Watch pass</p>
            <AuthForm />
          </div>
        </section>
      </div>
    </div>
  );
}

function CedarSilhouette() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="pointer-events-none mb-2 h-24 w-40 text-[#d4a017] sm:h-32 sm:w-52"
      aria-hidden
    >
      <ellipse cx="110" cy="148" rx="42" ry="6" fill="currentColor" opacity="0.2" />
      <path
        fill="currentColor"
        d="M110 8c-6 18-22 30-38 38l12 4c-18 10-34 22-48 38l16 3c-14 12-24 26-28 42h172c-4-16-14-30-28-42l16-3c-14-16-30-28-48-38l12-4C132 38 116 26 110 8Z"
      />
      <rect x="102" y="118" width="16" height="28" rx="2" fill="#0a1a12" />
    </svg>
  );
}
