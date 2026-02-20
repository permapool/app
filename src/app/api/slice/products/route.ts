const SLICE_PRODUCTS_URL =
  "https://slice.so/api/slicer/0xb53/products?fromSlicer=true&isOnsite=false&isOnline=true";

export const revalidate = 300;

export async function GET() {
  try {
    const upstream = await fetch(SLICE_PRODUCTS_URL, {
      headers: { accept: "application/json" },
      next: { revalidate },
    });

    if (!upstream.ok) {
      return Response.json(
        { error: "Failed to fetch products from Slice." },
        { status: upstream.status }
      );
    }

    const data = (await upstream.json()) as unknown;

    return Response.json(data, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=300",
      },
    });
  } catch {
    return Response.json(
      { error: "Unable to reach Slice products endpoint." },
      { status: 500 }
    );
  }
}
