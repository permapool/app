"use client";

import { useEffect, useMemo, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

const STORE_URL = "https://shop.slice.so/store/2899";
const CREDIT_CARD_URL =
  "https://higher-zip.myshopify.com/products/higher-calendar?variant=44811040587878";

type SliceProduct = {
  name?: string;
  images?: string[];
  shortDescription?: string;
  description?: string;
};

type SliceResponse = {
  data?: {
    products?: SliceProduct[];
  };
};

export default function CalendarContent() {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<SliceProduct | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadMiniAppContext = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        if (mounted) setIsMiniApp(inMiniApp);
        if (inMiniApp) {
          await sdk.actions.ready();
        }
      } catch {
        if (mounted) setIsMiniApp(false);
      }
    };

    loadMiniAppContext();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      try {
        const response = await fetch("/api/slice/products");

        if (!response.ok) {
          throw new Error("Unable to load calendar product.");
        }

        const json = (await response.json()) as SliceResponse;
        const firstProduct = json.data?.products?.[0] ?? null;

        if (mounted) {
          setProduct(firstProduct);
          setError(firstProduct ? null : "No products available.");
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      mounted = false;
    };
  }, []);

  const productImage = useMemo(() => product?.images?.[0] ?? null, [product]);

  const handleBuyClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMiniApp) return;

    event.preventDefault();

    try {
      await sdk.actions.openUrl(STORE_URL);
    } catch {
      window.location.href = STORE_URL;
    }
  };

  const handleCreditCardClick = async (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (!isMiniApp) return;

    event.preventDefault();

    try {
      await sdk.actions.openUrl(CREDIT_CARD_URL);
    } catch {
      window.location.href = CREDIT_CARD_URL;
    }
  };

  if (loading) {
    return <p className="text-sm uppercase tracking-wide">Loading calendar...</p>;
  }

  if (error || !product) {
    return (
      <div className="text-sm uppercase tracking-wide">
        {error ?? "Unable to load product."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl border border-black bg-white p-4 shadow-solid">
      <h1 className="text-xl md:text-2xl uppercase tracking-wide">{product.name}</h1>
      {product.shortDescription ? (
        <p className="mt-2 text-sm leading-relaxed">{product.shortDescription}</p>
      ) : null}

      {productImage ? (
        <div className="mt-4 w-full bg-white p-2">
          <img
            src={productImage}
            alt={product.name ?? "Higher Calendar"}
            className="block h-auto max-w-full"
          />
        </div>
      ) : null}
      {product.description ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{product.description}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={STORE_URL}
          target={isMiniApp ? undefined : "_blank"}
          rel={isMiniApp ? undefined : "noreferrer"}
          onClick={handleBuyClick}
          className="inline-block bg-black px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-green-700"
        >
          Buy with USDC
        </a>

        <a
          href={CREDIT_CARD_URL}
          target={isMiniApp ? undefined : "_blank"}
          rel={isMiniApp ? undefined : "noreferrer"}
          onClick={handleCreditCardClick}
          className="inline-block bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-black border border-black transition-colors hover:bg-black hover:text-white"
        >
          Buy with Credit Card
        </a>
      </div>
    </div>
  );
}
