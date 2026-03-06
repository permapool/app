"use client";

import { useEffect, useMemo, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import BarLoader from "~/components/BarLoader";

const STORE_URL = "https://shop.slice.so/store/2899?productId=5";
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
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadMiniAppContext = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        if (mounted) setIsMiniApp(inMiniApp);
        if (inMiniApp) await sdk.actions.ready();
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

  const images = useMemo(() => {
    const fallbackImages = [
      "/yotfh/photo_2026-03-03_02-12-48.jpg",
      "/yotfh/photo_2026-03-03_02-12-58.jpg",
      "/yotfh/photo_2026-03-03_02-13-00.jpg",
      "/yotfh/photo_2026-03-03_02-13-02.jpg",
      "/yotfh/photo_2026-03-03_02-13-03.jpg",
      "/yotfh/photo_2026-03-03_02-13-05.jpg",
      "/yotfh/photo_2026-03-03_02-13-07.jpg",
      "/yotfh/photo_2026-03-03_02-13-09.jpg",
      "/yotfh/photo_2026-03-03_02-13-12.jpg",
      "/yotfh/photo_2026-03-03_02-13-14.jpg",
    ];

    return productImage ? [productImage, ...fallbackImages] : fallbackImages;
  }, [productImage]);

  useEffect(() => {
    if (images.length > 0) {
      setActiveImage(images[0]);
    }
  }, [images]);

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
    event: React.MouseEvent<HTMLAnchorElement>,
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
    return (
      <div className="w-full h-8">
        <BarLoader intervalRate={100} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-sm uppercase tracking-wide">
        {error ?? "Unable to load product."}
      </div>
    );
  }

  return (
    <div>
      {" "}
      {/* className="w-full max-w-xl border border-black bg-white p-4 shadow-solid" */}
      <div className="flex justify-between items-center p-2 mb-4">
        <button className="flex rounded-full text-white h-full w-[50]">
          ↑
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeImage && (
          <div className="bg-white">
            <img
              src={activeImage}
              alt={product.name ?? "Higher Calendar"}
              className="block h-auto max-w-full"
            />

            {images.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {images.map((img) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(img)}
                    className={`border p-1 ${
                      activeImage === img ? "border-black" : "border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      className="h-16 w-auto cursor-pointer opacity-90 hover:opacity-100"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="border border-black bg-white p-4 shadow-solid">
          <h2 className="text-foreground text-xl md:text-2xl uppercase tracking-wide">
            {product.name}
          </h2>

          <div>
            {product.shortDescription && (
              <p className="text-sm mt-4 leading-relaxed text-grey">
                {product.shortDescription}
              </p>
            )}
          </div>

          <div className="text-5xl mt-4 text-[var(--green)]">$44.44</div>

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={STORE_URL}
              target={isMiniApp ? undefined : "_blank"}
              rel={isMiniApp ? undefined : "noreferrer"}
              onClick={handleBuyClick}
              className="inline-block bg-black px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover-hover:bg-green-700"
            >
              Buy with USDC
            </a>

            <a
              href={CREDIT_CARD_URL}
              target={isMiniApp ? undefined : "_blank"}
              rel={isMiniApp ? undefined : "noreferrer"}
              onClick={handleCreditCardClick}
              className="inline-block bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-black border border-black transition-colors hover-hover:bg-black hover-hover:text-white"
            >
              Buy with Credit Card
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
