const termsSections = [
  {
    title: "Service Scope",
    points: [
      "My Net Worth is a manual tracking tool that shows your financial picture on one page in a single table.",
      "The service supports many asset and liability types, including stocks, crypto, 401(k), mortgage balances, and credit card debt.",
    ],
  },
  {
    title: "Acceptance of Terms",
    points: [
      "By accessing or using My Net Worth, you agree to these Terms of Service.",
      "If you do not agree, do not use the service.",
    ],
  },
  {
    title: "Eligibility and Accounts",
    points: [
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You are responsible for all activity that occurs under your account.",
    ],
  },
  {
    title: "Your Content and Data",
    points: [
      "You retain ownership of the data you provide, including portfolio and account content.",
      "You grant us permission to process your data solely to operate and improve the service.",
      "You are responsible for the accuracy of values you enter or update in the app.",
    ],
  },
  {
    title: "No Financial Account Connections or Custody",
    points: [
      "My Net Worth does not connect to your bank account, crypto wallet, or other financial accounts.",
      "We never touch, move, or have access to your funds.",
      "You remain solely responsible for all financial decisions and transactions.",
    ],
  },
  {
    title: "Acceptable Use",
    points: [
      "Do not misuse the service, interfere with operations, or attempt unauthorized access.",
      "Do not use the service for unlawful activities.",
    ],
  },
  {
    title: "Service Availability",
    points: [
      "We may update, suspend, or discontinue features at any time.",
      "We aim for reliability but do not guarantee uninterrupted availability.",
    ],
  },
  {
    title: "Limitation of Liability",
    points: [
      "The service is provided on an as-is and as-available basis.",
      "To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages.",
    ],
  },
  {
    title: "Termination",
    points: [
      "You may stop using the service at any time.",
      "We may suspend or terminate access for violations of these terms or to protect the platform.",
    ],
  },
];

export default function TermsOfServicePageTemplate() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Legal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Effective date: February 8, 2026
        </p>
        <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
          These terms govern your use of My Net Worth and describe your rights
          and responsibilities, including important limits on account
          connections and fund access.
        </p>
      </header>

      <section className="space-y-6">
        {termsSections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-slate-200/80 bg-white/70 p-4 sm:p-5 dark:border-white/10 dark:bg-white/5"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {section.title}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-200">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white/70 p-4 text-sm leading-6 text-slate-700 sm:p-5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Contact
        </h2>
        <p className="mt-3">
          Questions about these terms can be sent to{" "}
          <a className="underline" href="mailto:networthpdx@googlegroups.com">
            networthpdx@googlegroups.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
