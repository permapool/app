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

import Pipes, {
  DIRECTIONS,
  FADE_DURATION_MS,
  GRID_SIZE,
  MAX_DYNAMIC_MESHES,
  MAX_PIPE_SEGMENTS,
  MAX_PIPES,
  MAX_SEGMENT_GRID_UNITS,
  MIN_PIPE_SEGMENTS,
  MIN_SEGMENT_GRID_UNITS,
  NOMINAL_FRAMES_PER_SECOND,
  ORIGINAL_SPEED_PER_FRAME,
  PIPE_COLORS,
  RESET_TIME_MS,
  SPEED_PER_SECOND,
  elapsedGrowth,
  isImmediateReverse,
  orientPipeAlongDirection,
  pipeSegmentCountFromUnitRandom,
  regularFadeOpacity,
  segmentDistanceFromUnitRandom,
  segmentEndpoint,
  setPipeGrowth,
  shouldStartComplexityFade,
} from "./Pipes";
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

function runNextAnimationFrame(timestamp: number) {
  const next = animationCallbacks.entries().next().value as
    | [number, FrameRequestCallback]
    | undefined;
  if (!next) throw new Error("No animation frame is scheduled");
  animationCallbacks.delete(next[0]);
  next[1](timestamp);
}

function dynamicMeshCount(renderer: (typeof rendererMock.instances)[number]) {
  const lastRender = renderer.render.mock.calls.at(-1);
  const scene = lastRender?.[0] as THREE.Scene | undefined;
  return scene?.children.filter((child) =>
    child instanceof THREE.Mesh &&
    !(child.geometry instanceof THREE.PlaneGeometry)).length ?? 0;
}

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

  it("preserves the original one-pipe grid and segment ranges", () => {
    expect(MAX_PIPES).toBe(1);
    expect(DIRECTIONS).toHaveLength(6);
    for (const direction of DIRECTIONS) {
      const nonzeroAxes = [direction.x, direction.y, direction.z]
        .filter((component) => component !== 0);
      expect(nonzeroAxes).toHaveLength(1);
      expect(Math.abs(nonzeroAxes[0])).toBe(1);
    }

    expect(segmentDistanceFromUnitRandom(0)).toBe(MIN_SEGMENT_GRID_UNITS * GRID_SIZE);
    expect(segmentDistanceFromUnitRandom(1)).toBe(MAX_SEGMENT_GRID_UNITS * GRID_SIZE);
    expect(pipeSegmentCountFromUnitRandom(0)).toBe(MIN_PIPE_SEGMENTS);
    expect(pipeSegmentCountFromUnitRandom(1)).toBe(MAX_PIPE_SEGMENTS);
  });

  it("excludes only the immediate reverse direction", () => {
    for (const previous of DIRECTIONS) {
      const reversals = DIRECTIONS.filter((candidate) =>
        isImmediateReverse(candidate, previous));
      expect(reversals).toHaveLength(1);
      expect(reversals[0].equals(previous.clone().negate())).toBe(true);
    }
  });

  it("keeps consecutive segment endpoints and turn joints connected", () => {
    const start = new THREE.Vector3(20, -40, 60);
    const firstDirection = new THREE.Vector3(1, 0, 0);
    const turnDirection = new THREE.Vector3(0, 1, 0);
    const joint = segmentEndpoint(start, firstDirection, 4 * GRID_SIZE);
    const secondEnd = segmentEndpoint(joint, turnDirection, 3 * GRID_SIZE);

    expect(joint).toEqual(new THREE.Vector3(100, -40, 60));
    expect(secondEnd).toEqual(new THREE.Vector3(100, 20, 60));
  });

  it("anchors a growing cylinder at its start and extends it along local Y", () => {
    const geometry = new THREE.CylinderGeometry(8, 8, 1, 8);
    geometry.translate(0, 0.5, 0);
    const mesh = new THREE.Mesh(geometry);
    const start = new THREE.Vector3(40, 20, -60);
    const direction = new THREE.Vector3(0, 0, -1);
    mesh.position.copy(start);
    orientPipeAlongDirection(mesh, direction);
    setPipeGrowth(mesh, 80);
    mesh.updateMatrixWorld(true);

    expect(new THREE.Vector3(0, 0, 0).applyMatrix4(mesh.matrixWorld).distanceTo(start))
      .toBeLessThan(1e-10);
    expect(
      new THREE.Vector3(0, 1, 0).applyMatrix4(mesh.matrixWorld)
        .distanceTo(segmentEndpoint(start, direction, 80)),
    ).toBeLessThan(1e-10);
    geometry.dispose();
  });

  it("converts the original frame speed to deterministic elapsed-time growth", () => {
    expect(SPEED_PER_SECOND).toBe(
      ORIGINAL_SPEED_PER_FRAME * NOMINAL_FRAMES_PER_SECOND,
    );
    expect(elapsedGrowth(1 / NOMINAL_FRAMES_PER_SECOND)).toBeCloseTo(
      ORIGINAL_SPEED_PER_FRAME,
      10,
    );
    expect(elapsedGrowth(1)).toBe(SPEED_PER_SECOND * 0.1);
  });

  it("fades only at the end of the cycle and uses a whole-scene safety bound", () => {
    expect(regularFadeOpacity(RESET_TIME_MS - FADE_DURATION_MS - 1)).toBe(0);
    expect(regularFadeOpacity(RESET_TIME_MS - FADE_DURATION_MS / 2)).toBe(0.5);
    expect(regularFadeOpacity(RESET_TIME_MS)).toBe(1);
    expect(shouldStartComplexityFade(MAX_DYNAMIC_MESHES - 3)).toBe(false);
    expect(shouldStartComplexityFade(MAX_DYNAMIC_MESHES - 2)).toBe(true);
  });

  it("retains complete accumulated paths until the whole-scene reset", () => {
    render(<Pipes onError={vi.fn()} />);
    const renderer = rendererMock.instances[0];
    const startedAt = performance.now();
    let previousCount = 0;

    act(() => runNextAnimationFrame(startedAt));
    for (let elapsed = 100; elapsed <= 30_000; elapsed += 100) {
      act(() => runNextAnimationFrame(startedAt + elapsed));
      const count = dynamicMeshCount(renderer);
      expect(count).toBeGreaterThanOrEqual(previousCount);
      previousCount = count;
    }

    expect(previousCount).toBeGreaterThan(80);
    act(() => runNextAnimationFrame(startedAt + 31_500));
    expect(dynamicMeshCount(renderer)).toBe(previousCount);
    act(() => runNextAnimationFrame(startedAt + 32_100));
    expect(dynamicMeshCount(renderer)).toBeLessThan(previousCount);
  });

  it("renders connected segments with a joint at each shared turn", () => {
    render(<Pipes onError={vi.fn()} />);
    const renderer = rendererMock.instances[0];
    const startedAt = performance.now();
    act(() => runNextAnimationFrame(startedAt));
    act(() => runNextAnimationFrame(startedAt + 100));

    const scene = renderer.render.mock.calls.at(-1)?.[0] as THREE.Scene;
    const cylinders = scene.children.filter((child): child is THREE.Mesh =>
      child instanceof THREE.Mesh &&
      child.geometry instanceof THREE.CylinderGeometry);
    const spheres = scene.children.filter((child): child is THREE.Mesh =>
      child instanceof THREE.Mesh &&
      child.geometry instanceof THREE.SphereGeometry);
    expect(cylinders.length).toBeGreaterThanOrEqual(1);

    const first = cylinders[0];
    first.updateMatrixWorld(true);
    const start = new THREE.Vector3(0, 0, 0).applyMatrix4(first.matrixWorld);
    const end = new THREE.Vector3(0, 1, 0).applyMatrix4(first.matrixWorld);
    expect(spheres.some((sphere) => sphere.position.distanceTo(start) < 1e-10)).toBe(true);
    expect(spheres.some((sphere) => sphere.position.distanceTo(end) < 1e-10)).toBe(true);

    if (cylinders.length > 1) {
      expect(cylinders[1].position.distanceTo(end)).toBeLessThan(1e-10);
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
