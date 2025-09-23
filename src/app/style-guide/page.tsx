import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style Guide",
  description: "Brand tokens, typography, and elements pulled from global.css",
};

const TOKENS = [
  { name: "Background", varName: "--background", value: "#fffff8" },
  { name: "Foreground", varName: "--foreground", value: "#111" },
  { name: "Grey", varName: "--grey", value: "rgb(187, 187, 187)" },
  { name: "Light Grey", varName: "--lghtgrey", value: "rgb(230, 230, 230)" },
  { name: "Green", varName: "--green", value: "#018A08" },
  { name: "Amber", varName: "--amber", value: "#FFA500" },
];

export default function StyleGuidePage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <header className="mb-8">
        <h1>Style Guide</h1>
        <p className="subtitle">
          Last update: <code>2025-08-27</code>.
        </p>
      </header>

      {/* Opener */}
      <section className="mt-4">
        <p>Welcome to the HIGHER.ZIP Brand Guidelines.</p>
        <p>
          This page lays out the core elements of our identity system and
          explains how we use them to build a consistent presence across
          mediums. These guidelines are designed to protect the integrity of
          HIGHER.ZIP while leaving room for experimentation and play.
        </p>
        <p>
          By following this guide, you’ll help maintain a voice and visual
          language that feels unmistakably ours—sharp, memorable, and aligned
          with the spirit of the network. Think of this as both a manual and a
          launchpad: a starting point for design and storytelling choices.
        </p>
        <p>
          When using elements from the HIGHER.ZIP toolkit, pay attention to
          balance. Some elements can be dialed up for bold expression, while
          others can be dialed back to let the work breathe. What matters most
          is staying true to the core identity while adapting to the needs of
          each application.
        </p>
      </section>

      {/* Table of Contents */}
      <section className="mt-4">
        <h3>Table of Contents</h3>
        <ul>
          <li>
            <a href="#visual-identity">Visual Identity</a>
            <li>
              <a href="#logo">Logo</a>
            </li>
            <li>
              <a href="#typography">Typography</a>
            </li>
          </li>

          <li>
            <a href="#color-tokens">Color Tokens</a>
          </li>
          <li>
            <a href="#elements">Elements</a>
          </li>
          <li>
            <a href="#system-notes">System Notes</a>
          </li>
        </ul>
      </section>
      <h2>Visual Identity</h2>
      {/* Visual Identity - Introduction */}
      <section className="mt-4">
        <h3>Introduction</h3>
        <p>Our visual identity is a system of moving parts.</p>
        <p>
          When used together with intention, these elements create coherence
          across every HIGHER.ZIP touchpoint. The strength of our design comes
          from knowing when to push and when to hold back—restraint and
          precision are as important as boldness.
        </p>
        <p>
          We say more by showing less. Our typography is clear and direct. Our
          colors are vivid and unmistakable. The logo is designed to cut through
          noise and hold its ground.
        </p>
        <p>
          The building blocks of our expression include logo, color, typography,
          photography, and pattern. The following sections detail how each
          element works on its own, and how they come together to create the
          HIGHER.ZIP experience.
        </p>
      </section>

      <section className="mt-4">
        <h3>Logo</h3>
        <div className="flex items-center border p-10">
          <img src="/logo-full.svg" alt="HIGHER.ZIP Logo" />
        </div>
        <p>
          This is the HIGHER.ZIP wordmark.The logo is the centerpiece of our
          identity. It is bold, precise, and instantly recognizable.
        </p>
        <p>
          Formally, it is built on geometric rigor and modular proportion,
          echoing the grid-like logic that runs through HIGHER.ZIP. Its
          structure is minimal yet uncompromising, designed to work across
          digital and physical contexts without losing impact.
        </p>
        <p>
          The wordmark is confident enough to stand on its own, needing little
          to no supporting text. Its construction divides naturally into
          vertical sections, a detail that informs the multi-column grid used
          throughout the brand system. This grid anchors our layouts,
          typography, and visual rhythm, ensuring coherence across all
          applications.
        </p>
      </section>

      {/* Typography */}
      <section className="mt-10 space-y-4">
        <h3>Typography</h3>

        <h4>Overview</h4>
        <p>
          The type system of HIGHER.ZIP is designed for clarity and impact. We
          use one primary typeface, Geist, across headlines, secondary text, and
          body copy to create consistency and rhythm throughout all
          communications. On web, when Geist is not available, Helvetica serves
          as the fallback.
        </p>

        <p>
          Geist reflects the balance of simplicity and precision that defines
          HIGHER.ZIP. Its clean forms and flexible weights allow it to adapt
          across digital and print contexts, giving us room for both bold
          expression and subtle restraint. When needed, Helvetica provides
          reliable continuity, ensuring the system maintains its integrity
          wherever it is applied.
        </p>

        <p>
          This section will showcase the available weights, demonstrate how
          typography is applied, and provide guidance on setting type so it
          feels balanced, legible, and aligned with the overall system.
        </p>

        <div className="border p-4">
          <h4>Headings</h4>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="border p-2 flex flex-col space-between">
              <h1 className="bg-[var(--lghtgrey)] p-2">H1 / Display</h1>
              <p className="small-font text-grey">
                Uppercase, 400 weight, custom margins.
              </p>
            </div>
            <div className="border p-2 flex flex-col space-between">
              <h2 className="bg-[var(--lghtgrey)] p-2">H2 / Section</h2>
              <p className="small-font text-grey">Uppercase, grey color.</p>
            </div>
            <div className="border p-2 flex flex-col space-between">
              <h3 className="bg-[var(--lghtgrey)] p-2">H3 / Subsection</h3>
              <p className="small-font text-grey">Uppercase, smaller, grey.</p>
            </div>
          </div>

          <p>
            Body text – rendered with global <code>p</code> rules (1.4rem size,
            2rem line-height, 500 weight).
          </p>
          <p className="subtitle">
            Subtitle – <code>p.subtitle</code> style.
          </p>
          <p className="fine-print">
            Fine print – <code>p.fine-print</code> style.
          </p>

          <ol>
            <li>Ordered list item</li>
            <li>Another list item</li>
          </ol>
        </div>
      </section>

      {/* Color */}
      <section className="mt-10 space-y-4">
        <h3>Color</h3>

        <h4>Color Tokens</h4>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOKENS.map((t) => (
            <li key={t.varName} className="flex items-center gap-3 border p-3">
              <div
                className="h-14 w-14 ring-1 ring-black/5"
                style={{ background: `var(${t.varName})` }}
                title={`${t.name}: ${t.value}`}
              />
              <div className="min-w-0">
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-slate-600">
                  <code className="mr-2">{t.value}</code>
                  <code>{t.varName}</code>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Elements from global.css */}
      <section className="mt-10">
        <h2>Elements</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="border p-4">
            <h3>Buttons</h3>
            <div className="flex items-center gap-3">
              <button>Primary</button>
              <button disabled>Disabled</button>
            </div>
            <p className="small-font text-gray-600 mt-2">
              Buttons use <code>var(--green)</code>; hover scales; disabled uses{" "}
              <code>--lghtgrey</code>/<code>--grey</code>.
            </p>
          </div>

          <div className="border p-4">
            <h3>Text Input</h3>
            <div>
              <input type="text" placeholder="Type here…" />
            </div>
            <p className="small-font text-gray-600 mt-2">
              Inputs use your global padding, border, and color rules.
            </p>
          </div>

          <div className="border p-4">
            <h3>Links</h3>
            <p>
              <a href="#">This is a link</a> — colored with <code>--green</code>
              , hover scales slightly.
            </p>
          </div>

          <div className="border p-4">
            <h3>Section & Rule</h3>
            <section className="section-border">
              <p className="small-font text-gray-600">
                Global <code>section</code> background and radius shown here.
              </p>
            </section>
            <hr />
            <p className="small-font text-gray-600">
              Global <code>hr</code> width, height, and border color.
            </p>
          </div>
        </div>
      </section>

      {/* System Notes */}
      <section className="mt-10">
        <h2>System Notes</h2>
        <ul className="list-disc pl-6">
          <li>
            Font stack from <code>body</code>: Geist (Google Fonts) → system
            fallbacks.
          </li>
          <li>
            Global tokens on <code>:root</code>: <code>--background</code>,{" "}
            <code>--foreground</code>, <code>--grey</code>,{" "}
            <code>--lghtgrey</code>, <code>--green</code>.
          </li>
          <li>Scrollbars hidden globally via vendor rules.</li>
          <li>
            Mobile overrides at <code>@media(max-width: 600px)</code> for{" "}
            <code>h1/h2/h3</code> and <code>button</code>.
          </li>
        </ul>
      </section>
    </main>
  );
}
