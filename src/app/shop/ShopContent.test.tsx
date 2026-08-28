// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ShopContent from "./ShopContent";

describe("ShopContent", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the temporary unavailable state without implying an empty catalog", () => {
    render(<ShopContent />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Products are temporarily unavailable here.",
    );
    expect(screen.getByText("Products are temporarily unavailable here.")).toBeInTheDocument();
    expect(screen.getByText(/general shop scaffold/i)).toBeInTheDocument();
  });

  it("links to the general Slice storefront without a product query", () => {
    render(<ShopContent />);

    const link = screen.getByRole("link", { name: "Visit our Slice shop" });
    expect(link).toHaveAttribute("href", "https://slice.so/store/2899");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
