// @vitest-environment jsdom

import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rendererMock = vi.hoisted(() => ({
  fail: false,
  instances: [] as Array<{
    domElement: HTMLCanvasElement;
    setPixelRatio: ReturnType<typeof vi.fn>;
    setSize: ReturnType<typeof vi.fn>;
    render: ReturnType<typeof vi.fn>;
    renderLists: { dispose: ReturnType<typeof vi.fn> };
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
import * as THREE from "three";

let resizeCallback: ResizeObserverCallback;
let resizeDisconnect: ReturnType<typeof vi.fn>;
let reducedMotion = false;
let hidden = false;
let motionChange: ((event: MediaQueryListEvent) => void) | undefined;
let motionAddListener: ReturnType<typeof vi.fn>;
let motionRemoveListener: ReturnType<typeof vi.fn>;
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
    resizeDisconnect = vi.fn();
    motionChange = undefined;
    motionAddListener = vi.fn((type, listener) => {
      if (type === "change") motionChange = listener;
    });
    motionRemoveListener = vi.fn();
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: ResizeObserverCallback) { resizeCallback = callback; }
      observe = vi.fn();
      disconnect = resizeDisconnect;
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
      addEventListener: motionAddListener,
      removeEventListener: motionRemoveListener,
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
    const canvas = wrapper.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass("block", "h-full", "w-full", "pointer-events-none");
    expect(document.body.querySelectorAll("canvas")).toHaveLength(1);
    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      width: 640, height: 360, top: 0, left: 0, right: 640, bottom: 360, x: 0, y: 0,
      toJSON: () => ({}),
    });
    act(() => resizeCallback([], {} as ResizeObserver));
    expect(rendererMock.instances[0].setSize).toHaveBeenLastCalledWith(640, 360, false);
  });

  it("keeps CSS fill sizing independent from the capped drawing-buffer ratio", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    const { container } = render(<Pipes onError={vi.fn()} />);
    const canvas = container.querySelector("canvas");
    expect(rendererMock.instances[0].setPixelRatio).toHaveBeenCalledWith(1.5);
    expect(canvas).toHaveClass("block", "h-full", "w-full");
    expect(canvas?.getAttribute("style")).toBeNull();
  });

  it("renders a static scene for reduced motion", () => {
    reducedMotion = true;
    render(<Pipes onError={vi.fn()} />);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(rendererMock.instances[0].render).toHaveBeenCalled();
  });

  it("responds to reduced-motion preference changes without duplicate loops", () => {
    render(<Pipes onError={vi.fn()} />);
    expect(animationCallbacks.size).toBe(1);
    act(() => motionChange?.({ matches: true } as MediaQueryListEvent));
    expect(animationCallbacks.size).toBe(0);
    act(() => motionChange?.({ matches: false } as MediaQueryListEvent));
    expect(animationCallbacks.size).toBe(1);
  });

  it("pauses animation while hidden and disposes all renderer work", () => {
    const { unmount } = render(<Pipes onError={vi.fn()} />);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(cancelAnimationFrame).toHaveBeenCalled();
    const renderer = rendererMock.instances[0];
    unmount();
    expect(resizeDisconnect).toHaveBeenCalledOnce();
    expect(motionRemoveListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(renderer.renderLists.dispose).toHaveBeenCalledOnce();
    expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("survives Strict Mode remount without duplicate canvases", () => {
    const { container, unmount } = render(
      <StrictMode><Pipes onError={vi.fn()} /></StrictMode>,
    );
    const canvases = container.querySelectorAll("canvas");
    expect(canvases).toHaveLength(1);
    expect(canvases[0]).toHaveClass("block", "h-full", "w-full", "pointer-events-none");
    expect(animationCallbacks.size).toBe(1);
    unmount();
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    expect(rendererMock.instances.every((renderer) => renderer.dispose.mock.calls.length === 1)).toBe(true);
  });

  it("disposes shared geometries and materials exactly once per mount", () => {
    const geometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, "dispose");
    const materialDispose = vi.spyOn(THREE.Material.prototype, "dispose");
    const { unmount } = render(<Pipes onError={vi.fn()} />);
    unmount();
    expect(geometryDispose).toHaveBeenCalledTimes(4);
    expect(materialDispose).toHaveBeenCalledTimes(2);
  });

  it("ignores an already queued resize callback after teardown", () => {
    const { unmount } = render(<Pipes onError={vi.fn()} />);
    const renderer = rendererMock.instances[0];
    const callsBeforeUnmount = renderer.setSize.mock.calls.length;
    unmount();
    act(() => resizeCallback([], {} as ResizeObserver));
    expect(renderer.setSize).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it("reports WebGL context loss and removes the listener on teardown", () => {
    const onError = vi.fn();
    const { unmount } = render(<Pipes onError={onError} />);
    const canvas = rendererMock.instances[0].domElement;
    const removeListener = vi.spyOn(canvas, "removeEventListener");
    const event = new Event("webglcontextlost", { cancelable: true });
    act(() => canvas.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(onError).toHaveBeenCalledOnce();
    unmount();
    expect(removeListener).toHaveBeenCalledWith("webglcontextlost", expect.any(Function));
  });

  it("reports WebGL initialization failure", () => {
    rendererMock.fail = true;
    const onError = vi.fn();
    render(<Pipes onError={onError} />);
    expect(onError).toHaveBeenCalledOnce();
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
  });
});
