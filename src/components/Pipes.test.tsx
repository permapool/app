// @vitest-environment jsdom

import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rendererMock = vi.hoisted(() => ({
  fail: false,
  instances: [] as Array<{
    domElement: HTMLCanvasElement;
    setSize: ReturnType<typeof vi.fn>;
    render: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    forceContextLoss: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class WebGLRenderer {
    domElement = document.createElement("canvas");
    setClearColor = vi.fn();
    setPixelRatio = vi.fn();
    setSize = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    renderLists = { dispose: vi.fn() };
    constructor() {
      if (rendererMock.fail) throw new Error("WebGL unavailable");
      rendererMock.instances.push(this);
    }
  }
  return { ...actual, WebGLRenderer };
});

import Pipes, { PIPE_COLORS } from "./Pipes";

let resizeCallback: ResizeObserverCallback;
let reducedMotion = false;
let hidden = false;
const animationCallbacks = new Map<number, FrameRequestCallback>();
let nextAnimationId = 1;

describe("Pipes", () => {
  beforeEach(() => {
    rendererMock.fail = false;
    rendererMock.instances.length = 0;
    reducedMotion = false;
    hidden = false;
    animationCallbacks.clear();
    nextAnimationId = 1;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: ResizeObserverCallback) { resizeCallback = callback; }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    });
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      const id = nextAnimationId++;
      animationCallbacks.set(id, callback);
      return id;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => animationCallbacks.delete(id)));
    vi.spyOn(window, "matchMedia").mockImplementation(() => ({
      matches: reducedMotion,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("uses only green-dominant pipe colors", () => {
    expect(PIPE_COLORS).toEqual([
      0x006b3c,
      0x008f4c,
      0x00a85a,
      0x00c568,
      0x00e676,
      0x39ff88,
      0x7cffa6,
    ]);
    for (const color of PIPE_COLORS) {
      const red = (color >> 16) & 0xff;
      const green = (color >> 8) & 0xff;
      const blue = color & 0xff;
      expect(green).toBeGreaterThan(red);
      expect(green).toBeGreaterThan(blue);
    }
  });

  it("owns and sizes its canvas inside the component container", () => {
    const { container } = render(<Pipes onError={vi.fn()} />);
    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper.querySelectorAll("canvas")).toHaveLength(1);
    expect(document.body.querySelectorAll("canvas")).toHaveLength(1);
    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      width: 640, height: 360, top: 0, left: 0, right: 640, bottom: 360, x: 0, y: 0,
      toJSON: () => ({}),
    });
    act(() => resizeCallback([], {} as ResizeObserver));
    expect(rendererMock.instances[0].setSize).toHaveBeenLastCalledWith(640, 360, false);
  });

  it("renders a static scene for reduced motion", () => {
    reducedMotion = true;
    render(<Pipes onError={vi.fn()} />);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(rendererMock.instances[0].render).toHaveBeenCalled();
  });

  it("pauses animation while hidden and disposes all renderer work", () => {
    const { unmount } = render(<Pipes onError={vi.fn()} />);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(cancelAnimationFrame).toHaveBeenCalled();
    const renderer = rendererMock.instances[0];
    unmount();
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("survives Strict Mode remount without duplicate canvases", () => {
    const { container, unmount } = render(
      <StrictMode><Pipes onError={vi.fn()} /></StrictMode>,
    );
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
    unmount();
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    expect(rendererMock.instances.every((renderer) => renderer.dispose.mock.calls.length === 1)).toBe(true);
  });

  it("reports WebGL initialization failure", () => {
    rendererMock.fail = true;
    const onError = vi.fn();
    render(<Pipes onError={onError} />);
    expect(onError).toHaveBeenCalledOnce();
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
  });
});
