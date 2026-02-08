const policySections = [
  {
    title: "Information We Collect",
    points: [
      "Account information, such as your email address and authentication details.",
      "Portfolio data you enter, including assets, liabilities, categories, and related values in your single-table dashboard.",
      "Examples of data you may enter include stocks, crypto, retirement accounts (like 401(k)), mortgage balances, and credit card debt.",
      "Basic technical data needed to operate the app, such as request logs and device/browser metadata.",
    ],
  },
  {
    title: "What We Do Not Collect or Access",
    points: [
      "We do not connect to your bank account, crypto wallet, or other financial accounts.",
      "We do not ingest account credentials for banks, brokerages, exchanges, or wallets.",
      "We never touch, move, or have access to your funds.",
    ],
  },
  {
    title: "How We Use Information",
    points: [
      "To provide and maintain your account and portfolio dashboard.",
      "To authenticate users, secure access, and prevent abuse.",
      "To improve product reliability, performance, and support.",
    ],
  },
  {
    title: "How We Share Information",
    points: [
      "We do not sell your personal information.",
      "We only share data with service providers that help run the app, such as hosting, authentication, and database infrastructure.",
      "We may disclose information if required by law or to protect rights, safety, and platform integrity.",
    ],
  },
  {
    title: "Data Retention",
    points: [
      "We retain account and portfolio data while your account remains active.",
      "If you close your account, we delete or anonymize data within a reasonable period, unless legal obligations require longer retention.",
    ],
  },
  {
    title: "Security",
    points: [
      "We use reasonable technical and organizational safeguards to protect your data.",
      "No system can be guaranteed 100% secure, but we continuously work to reduce risk and improve protections.",
    ],
  },
  {
    title: "Your Choices",
    points: [
      "You can update account settings and portfolio data in the app at any time.",
      "You may request account deletion through support.",
    ],
  },
];

export default function PrivacyPolicyPageTemplate() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Legal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Effective date: February 8, 2026
        </p>
        <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
          This policy explains what information My Net Worth collects, how we
          use it, what we do not access, and what choices you have.
        </p>
      </header>

      <section className="space-y-6">
        {policySections.map((section) => (
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
          Questions about this Privacy Policy can be sent to{" "}
          <a className="underline" href="mailto:networthpdx@googlegroups.com">
            networthpdx@googlegroups.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
