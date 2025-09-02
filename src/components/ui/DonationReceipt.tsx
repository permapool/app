import * as React from "react";

/* ---------- Helpers ---------- */

const DashedLine = () => (
  <div className="w-full border-t-2 border-dashed border-border border-[var(--amber)]" aria-hidden="true" />
);

const Barcode = ({ value }: { value: string }) => {
  const hashCode = (s: string) =>
    s.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  const seed = hashCode(value);
  const rand = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const bars = Array.from({ length: 60 }).map((_, i) => ({
    width: rand(seed + i) > 0.7 ? 2.5 : 1.5,
  }));

  const spacing = 1.5;
  const totalWidth = bars.reduce((acc, bar) => acc + bar.width + spacing, 0) - spacing;
  const svgWidth = 250;
  const svgHeight = 70;
  let currentX = (svgWidth - totalWidth) / 2;

  return (
    <div className="flex flex-col items-center py-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-label={`Barcode for value ${value}`}
        className="fill-current text-foreground"
      >
        {bars.map((bar, i) => {
          const x = currentX;
          currentX += bar.width + spacing;
          return <rect key={i} x={x} y="10" width={bar.width} height="50" />;
        })}
      </svg>
      <p className="text-[8px] text-muted-foreground mt-1">{value}</p>
    </div>
  );
};

const ConfettiExplosion = () => {
  const confettiCount = 100;
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#f97316"];
  return (
    <>
      <style>{`
        @keyframes donation-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-4"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 + Math.random() * 10}%`,
              backgroundColor: colors[i % colors.length],
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `donation-fall ${2.5 + Math.random() * 2.5}s ${Math.random() * 2}s linear forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
};

const shortAddr = (addr?: string, left = 6, right = 4) =>
  addr ? `${addr.slice(0, left)}…${addr.slice(-right)}` : "";

const explorerFor = (network: DonationReceiptProps["network"]) =>
  network === "ethereum"
    ? { name: "Etherscan", base: "https://etherscan.io" }
    : network === "base-sepolia"
    ? { name: "BaseScan", base: "https://sepolia.basescan.org" }
    : { name: "BaseScan", base: "https://basescan.org" };

const formatTokenAmount = (
  amount: number,
  tokenSymbol: string,
  decimals = tokenSymbol.toUpperCase() === "ETH" ? 5 : 2
) => {
  // clamp to a sensible number of decimals, trim trailing zeros
  return `${amount.toFixed(decimals).replace(/\.?0+$/, "")} ${tokenSymbol}`;
};

/* ---------- Props ---------- */

export interface DonationReceiptProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional internal id if we want to track it */
  receiptId?: string;

  /** Chain details */
  txHash: string;
  network?: "base" | "base-sepolia" | "ethereum";

  /** Wallets */
  donorAddress?: string;     // from
  projectAddress?: string;   // to

  /** Amount */
  amount: number;
  tokenSymbol: string;       // e.g., "ETH", "USDC"
  tokenDecimals?: number;    // optional override

  /** Time */
  date: Date;

  /** Visuals */
  barcodeValue?: string;     // defaults to txHash
  badge?: "Early Supporter" | "Founding Donor" | "Builder Fueler" | (string & {});
  donorNumber?: number;
  icon?: React.ReactNode;
}

/* ---------- arrow.svg as mask so it can use Tailwind color ---------- */
const ArrowGlyph = ({ className = "" }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={`inline-block bg-[currentColor] ${className}`}
    style={{
      maskImage: "url(/arrow.svg)",
      WebkitMaskImage: "url(/arrow.svg)",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskSize: "contain",
      WebkitMaskSize: "contain",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }}
  />
);

/* ---------- Component ---------- */

export const DonationReceipt = React.forwardRef<HTMLDivElement, DonationReceiptProps>(
  (
    {
      className = "",
      receiptId,
      txHash,
      network = "base",
      donorAddress,
      projectAddress,
      amount,
      tokenSymbol,
      tokenDecimals,
      date,
      barcodeValue,
      badge,
      donorNumber,
      icon,
      ...props
    },
    ref
  ) => {
    const [showConfetti, setShowConfetti] = React.useState(false);

    React.useEffect(() => {
      const a = setTimeout(() => setShowConfetti(true), 100);
      const b = setTimeout(() => setShowConfetti(false), 6000);
      return () => {
        clearTimeout(a);
        clearTimeout(b);
      };
    }, []);

    const { name: explorerName, base } = explorerFor(network);
    const txUrl = `${base}/tx/${txHash}`;
    const amountLabel = formatTokenAmount(amount, tokenSymbol, tokenDecimals);

    const formattedTimestamp = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(date)
      .replace(",", " •");

    return (
      <>
        {showConfetti && <ConfettiExplosion />}

        <div
          ref={ref}
          className={`relative flex flex-col max-h-[80%] w-full max-w-sm border border-[1px] border-black bg-card bg-[var(--background)] text-card-foreground shadow-solid z-10 animate-in fade-in-0 zoom-in-95 duration-500 ${className}`}
          {...props}
        >
          {/* Header */}
          <div className="p-8 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full animate-in zoom-in-50 delay-300 duration-500">
              {icon ?? (
                <ArrowGlyph className="w-10 h-10 text-primary animate-in zoom-in-75 delay-500 duration-500" />
              )}
            </div>
            <h1 className="text-2xl font-semibold mt-4">Thank you!</h1>
            <p className="text-muted-foreground mt-1">Your donation was received successfully.</p>

            {/* Badge + donor number */}
            {(badge || typeof donorNumber === "number") && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {badge && (
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {badge}
                  </span>
                )}
                {typeof donorNumber === "number" && (
                  <span className="px-2 py-1 rounded-full bg-muted text-foreground/80 text-xs font-medium">
                    You are donor #{donorNumber}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-8 pb-8 space-y-6 overflow-y-auto">
            <DashedLine />

            <div className="flex">
              <div>
                <h3>Transaction</h3>
                <p className="break-all">{shortAddr(txHash, 10, 10)}</p>
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-muted-foreground hover:text-foreground"
                >
                  View on {explorerName}
                </a>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <h3>Timestamp</h3>
                <p className="fine-print">{formattedTimestamp}</p>
              </div>

              <div className="text-right">
                <h3>Amount</h3>
                <p className="fine-print font-bold">{amountLabel}</p>
              </div>
            </div>

            

            <div>
              {donorAddress && (
                <div>
                  <h3>From</h3>
                  <p className="font-mono">{shortAddr(donorAddress)}</p>
                </div>
              )}
              {projectAddress && (
                <div>
                  <h3>To</h3>
                  <img src="/logo-full.svg" alt="Higher Channel" />
                  <p className="fine-print">{shortAddr(projectAddress)}</p>
                </div>
              )}
              {receiptId && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase">Receipt ID</p>
                  <p className="font-mono">{receiptId}</p>
                </div>
              )}
            </div>

            <DashedLine />

            <Barcode value={barcodeValue ?? txHash} />
          </div>
        </div>
      </>
    );
  }
);

DonationReceipt.displayName = "DonationReceipt";
