import { beforeEach, describe, expect, it, vi } from "vitest";

const ensMock = vi.hoisted(() => ({ resolveEnsName: vi.fn() }));

vi.mock("~/lib/ens", () => ({
  ENS_NEGATIVE_CACHE_TTL_MS: 60_000,
  ENS_POSITIVE_CACHE_TTL_MS: 300_000,
  resolveEnsName: ensMock.resolveEnsName,
}));

import { GET } from "./route";

const ADDRESS = "0x0000000000000000000000000000000000000001";

describe("GET /api/ens", () => {
  beforeEach(() => ensMock.resolveEnsName.mockReset());

  it("rejects invalid addresses without an upstream lookup", async () => {
    const response = await GET(new Request("http://localhost/api/ens?address=invalid"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ name: null });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(ensMock.resolveEnsName).not.toHaveBeenCalled();
  });

  it("returns only a normalized name with positive cache headers", async () => {
    ensMock.resolveEnsName.mockResolvedValue("example.eth");
    const response = await GET(new Request(`http://localhost/api/ens?address=${ADDRESS}`));

    expect(await response.json()).toEqual({ name: "example.eth" });
    expect(response.headers.get("vercel-cdn-cache-control")).toBe("public, max-age=300");
  });

  it("returns a generic bounded negative result without provider details", async () => {
    ensMock.resolveEnsName.mockResolvedValue(null);
    const response = await GET(new Request(`http://localhost/api/ens?address=${ADDRESS}`));
    const body = await response.json();

    expect(body).toEqual({ name: null });
    expect(response.headers.get("vercel-cdn-cache-control")).toBe("public, max-age=60");
    expect(JSON.stringify(body)).not.toMatch(/rpc|provider|url|timeout|credential|token|error/i);
  });
});
