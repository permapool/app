const sliceShopUrl = "https://slice.so/store/2899";

const previewBars = [
  "w-[78%]",
  "w-[64%]",
  "w-[86%]",
  "w-[52%]",
];

export default function ShopContent() {
  return (
    <section className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
      <div className="border border-black bg-white p-6 shadow-solid md:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-grey">Shop</p>

        <h1 className="mt-4 text-4xl uppercase tracking-tight md:text-6xl">
          HIGHER.ZIP Shop
        </h1>

        <p
          role="status"
          className="mt-6 max-w-2xl text-sm uppercase tracking-wide text-grey md:text-base"
        >
          Products are temporarily unavailable here.
        </p>

        <p className="mt-4 max-w-xl text-sm leading-relaxed md:text-base">
          Visit the live Slice storefront for the current catalog and product
          pages while this surface is being rebuilt.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={sliceShopUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-black px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover-hover:bg-green-700"
          >
            Visit our Slice shop
          </a>
        </div>
      </div>

      <aside className="border border-black bg-white p-6 shadow-solid md:p-8">
        <div className="flex items-center justify-between border-b border-black pb-4">
          <p className="text-xs uppercase tracking-[0.35em] text-grey">
            Storefront
          </p>
          <p className="text-xs uppercase tracking-[0.35em] text-grey">
            Unavailable
          </p>
        </div>

        <div className="mt-6 overflow-hidden border border-black">
          <div className="bg-[linear-gradient(135deg,#f8faff_0%,#fffdf4_54%,#f5fbf7_100%)] px-5 py-6">
            <div className="grid gap-3">
              {previewBars.map((widthClass, index) => (
                <div
                  key={widthClass}
                  className="flex items-center gap-3"
                >
                  <span className="h-3 w-3 rounded-full bg-[var(--green)]" />
                  <span
                    className={`h-4 rounded-full bg-black/80 animate-pulse ${widthClass}`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-grey">
          This page now acts as a general shop scaffold. Eligible products will
          land here once the Slice catalog read path is restored.
        </p>
      </aside>
    </section>
  );
}
