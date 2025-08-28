import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style Guide",
  description: "Brand tokens, typography, and elements pulled from global.css",
};

const TOKENS = [
  { name: "Background", varName: "--background", value: "#fffff8" },
  { name: "Foreground", varName: "--foreground", value: "#111" },
  { name: "Grey",       varName: "--grey",      value: "rgb(187, 187, 187)" },
  { name: "Light Grey", varName: "--lghtgrey",  value: "rgb(230, 230, 230)" },
  { name: "Green",      varName: "--green",     value: "#018A08" },
  { name: "Amber",      varName: "--amber",     value: "#FFA500" },
];

export default function StyleGuidePage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <header className="mb-8">
        <h1>Style Guide</h1>
        <p className="subtitle">Last update: <code>2025-08-27</code>.</p>
      </header>

      {/* Color Tokens */}
      <section className="mt-4">
        <h2>Color Tokens</h2>
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

      {/* Typography (uses your element selectors from global.css) */}
      <section className="mt-10 space-y-4">
        <h2>Typography</h2>

        <div className="border p-4">
          <h3>Headings</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="border p-2 flex flex-col space-between">
              <h1 className="bg-[var(--lghtgrey)] p-2">H1 / Display</h1>
              <p className="small-font text-grey">Uppercase, 400 weight, custom margins.</p>
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

          <p>Body text – rendered with global <code>p</code> rules (1.4rem size, 2rem line-height, 500 weight).</p>
          <p className="subtitle">Subtitle – <code>p.subtitle</code> style.</p>
          <p className="fine-print">Fine print – <code>p.fine-print</code> style.</p>

          <ol>
            <li>Ordered list item</li>
            <li>Another list item</li>
          </ol>
        </div>
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
              Buttons use <code>var(--green)</code>; hover scales; disabled uses <code>--lghtgrey</code>/<code>--grey</code>.
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
              <a href="#">This is a link</a> — colored with <code>--green</code>, hover scales slightly.
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
          <li>Font stack from <code>body</code>: Geist (Google Fonts) → system fallbacks.</li>
          <li>Global tokens on <code>:root</code>: <code>--background</code>, <code>--foreground</code>, <code>--grey</code>, <code>--lghtgrey</code>, <code>--green</code>.</li>
          <li>Scrollbars hidden globally via vendor rules.</li>
          <li>Mobile overrides at <code>@media(max-width: 600px)</code> for <code>h1/h2/h3</code> and <code>button</code>.</li>
        </ul>
      </section>
    </main>
  );
}
