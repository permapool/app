"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type PipesProps = {
  onError: () => void;
};

type Pipe = {
  currentPos: THREE.Vector3;
  direction: THREE.Vector3;
  targetPos: THREE.Vector3;
  currentMesh: THREE.Mesh | null;
  distanceTraveled: number;
  targetDistance: number;
  segmentsCount: number;
  maxSegments: number;
  material: THREE.MeshPhongMaterial;
};

export const GRID_SIZE = 20;
export const BOUNDS = 400;
export const PIPE_RADIUS = 8;
export const MAX_PIPES = 1;
export const ORIGINAL_SPEED_PER_FRAME = 20;
export const NOMINAL_FRAMES_PER_SECOND = 60;
export const SPEED_PER_SECOND = ORIGINAL_SPEED_PER_FRAME * NOMINAL_FRAMES_PER_SECOND;
export const RESET_TIME_MS = 32_000;
export const FADE_DURATION_MS = 1_000;
export const MIN_SEGMENT_GRID_UNITS = 2;
export const MAX_SEGMENT_GRID_UNITS = 6;
export const MIN_PIPE_SEGMENTS = 40;
export const MAX_PIPE_SEGMENTS = 120;
export const MAX_DYNAMIC_MESHES = 1_200;
const MAX_DELTA_SECONDS = 0.1;

export const PIPE_COLORS = [
  0x006b3c,
  0x008f4c,
  0x00a85a,
  0x00c568,
  0x00e676,
  0x39ff88,
  0x7cffa6,
] as const;

export const DIRECTIONS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

const PIPE_AXIS = new THREE.Vector3(0, 1, 0);

export function elapsedGrowth(deltaSeconds: number) {
  return SPEED_PER_SECOND * Math.min(Math.max(deltaSeconds, 0), MAX_DELTA_SECONDS);
}

export function isImmediateReverse(direction: THREE.Vector3, previous: THREE.Vector3) {
  return direction.x === -previous.x &&
    direction.y === -previous.y &&
    direction.z === -previous.z;
}

export function segmentDistanceFromUnitRandom(value: number) {
  const unit = Math.min(Math.max(value, 0), 1 - Number.EPSILON);
  const gridUnits = Math.floor(
    unit * (MAX_SEGMENT_GRID_UNITS - MIN_SEGMENT_GRID_UNITS + 1),
  ) + MIN_SEGMENT_GRID_UNITS;
  return gridUnits * GRID_SIZE;
}

export function pipeSegmentCountFromUnitRandom(value: number) {
  const unit = Math.min(Math.max(value, 0), 1 - Number.EPSILON);
  return Math.floor(unit * (MAX_PIPE_SEGMENTS - MIN_PIPE_SEGMENTS + 1)) +
    MIN_PIPE_SEGMENTS;
}

export function segmentEndpoint(
  start: THREE.Vector3,
  direction: THREE.Vector3,
  distance: number,
) {
  return start.clone().addScaledVector(direction, distance);
}

export function orientPipeAlongDirection(
  mesh: THREE.Mesh,
  direction: THREE.Vector3,
) {
  mesh.quaternion.setFromUnitVectors(PIPE_AXIS, direction);
}

export function setPipeGrowth(mesh: THREE.Mesh, distance: number) {
  mesh.scale.y = distance;
}

export function shouldStartComplexityFade(meshCount: number) {
  return meshCount + 2 >= MAX_DYNAMIC_MESHES;
}

export function regularFadeOpacity(cycleElapsedMs: number) {
  if (cycleElapsedMs < RESET_TIME_MS - FADE_DURATION_MS) return 0;
  return Math.min(
    Math.max((cycleElapsedMs - (RESET_TIME_MS - FADE_DURATION_MS)) /
      FADE_DURATION_MS, 0),
    1,
  );
}

function random() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 2 ** 32;
}

export default function Pipes({ onError }: PipesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let animationFrame: number | null = null;
    let lastFrameTime: number | null = null;
    let cycleStartedAt = performance.now();
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      onError();
      return;
    }

    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.className = "block h-full w-full pointer-events-none";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.rotation.y = random() * (Math.PI / 2) - Math.PI / 4;

    const camera = new THREE.PerspectiveCamera(45, 1, 1, 2_000);
    camera.position.set(0, 0, 800);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(ambientLight, directionalLight);

    const endpointGeometry = new THREE.SphereGeometry(PIPE_RADIUS * 1.25, 24, 24);
    const jointGeometry = new THREE.SphereGeometry(PIPE_RADIUS, 24, 24);
    const pipeGeometry = new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, 1, 24);
    // CylinderGeometry grows along local +Y. Translating its shared geometry by
    // half its unit height anchors each mesh at the preceding path endpoint.
    pipeGeometry.translate(0, 0.5, 0);
    const fadeGeometry = new THREE.PlaneGeometry(2_000, 2_000);
    const fadeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const fadeMesh = new THREE.Mesh(fadeGeometry, fadeMaterial);
    scene.add(fadeMesh);

    const occupiedPositions = new Set<string>();
    const dynamicMeshes: THREE.Mesh[] = [];
    const pipeMaterials: THREE.MeshPhongMaterial[] = [];
    let pipe: Pipe | null = null;
    let complexityFadeRequested = false;
    let earlyFadeStartedAt: number | null = null;

    const positionKey = (position: THREE.Vector3) =>
      `${Math.round(position.x)},${Math.round(position.y)},${Math.round(position.z)}`;

    const updateFadePosition = () => {
      fadeMesh.position
        .set(0, 0, 790)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), -scene.rotation.y);
      fadeMesh.rotation.y = -scene.rotation.y;
    };

    const createPipeMaterial = () => {
      const material = new THREE.MeshPhongMaterial({
        color: PIPE_COLORS[Math.floor(random() * PIPE_COLORS.length)],
        shininess: 30,
        specular: 0x3f3f3f,
      });
      pipeMaterials.push(material);
      return material;
    };

    const addMesh = (
      geometry: THREE.BufferGeometry,
      position: THREE.Vector3,
      material: THREE.MeshPhongMaterial,
    ) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      scene.add(mesh);
      dynamicMeshes.push(mesh);
      return mesh;
    };

    const clearDynamicMeshes = () => {
      for (const mesh of dynamicMeshes) scene.remove(mesh);
      dynamicMeshes.length = 0;
      for (const material of pipeMaterials) material.dispose();
      pipeMaterials.length = 0;
    };

    const isPathClear = (
      start: THREE.Vector3,
      direction: THREE.Vector3,
      distance: number,
    ) => {
      const steps = distance / GRID_SIZE;
      for (let step = 1; step <= steps; step += 1) {
        const position = start
          .clone()
          .add(direction.clone().multiplyScalar(step * GRID_SIZE));
        if (
          Math.abs(position.x) > BOUNDS ||
          Math.abs(position.y) > BOUNDS ||
          Math.abs(position.z) > BOUNDS ||
          occupiedPositions.has(positionKey(position))
        ) {
          return false;
        }
      }
      return true;
    };

    const reservePath = (
      start: THREE.Vector3,
      direction: THREE.Vector3,
      distance: number,
    ) => {
      for (let step = 1; step <= distance / GRID_SIZE; step += 1) {
        occupiedPositions.add(
          positionKey(
            start.clone().add(direction.clone().multiplyScalar(step * GRID_SIZE)),
          ),
        );
      }
    };

    const chooseMove = (start: THREE.Vector3, current?: THREE.Vector3) => {
      const choices = DIRECTIONS.filter(
        (direction) => !current || !isImmediateReverse(direction, current),
      ).sort(() => random() - 0.5);

      for (const direction of choices) {
        const distance = segmentDistanceFromUnitRandom(random());
        if (isPathClear(start, direction, distance)) return { direction, distance };
      }
      return null;
    };

    const createPipe = (): Pipe | null => {
      let start = new THREE.Vector3();
      let available = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        start = new THREE.Vector3(
          Math.round((random() * BOUNDS * 2 - BOUNDS) / GRID_SIZE) * GRID_SIZE,
          Math.round((random() * BOUNDS * 2 - BOUNDS) / GRID_SIZE) * GRID_SIZE,
          Math.round((random() * BOUNDS * 2 - BOUNDS) / GRID_SIZE) * GRID_SIZE,
        );
        if (!occupiedPositions.has(positionKey(start))) {
          available = true;
          break;
        }
      }
      if (!available) return null;

      const move = chooseMove(start);
      if (!move) return null;
      const material = createPipeMaterial();
      occupiedPositions.add(positionKey(start));
      reservePath(start, move.direction, move.distance);
      addMesh(endpointGeometry, start, material);

      return {
        currentPos: start,
        direction: move.direction,
        targetPos: segmentEndpoint(start, move.direction, move.distance),
        currentMesh: null,
        distanceTraveled: 0,
        targetDistance: move.distance,
        segmentsCount: 0,
        maxSegments: pipeSegmentCountFromUnitRandom(random()),
        material,
      };
    };

    const resetScene = () => {
      clearDynamicMeshes();
      occupiedPositions.clear();
      fadeMaterial.opacity = 0;
      scene.rotation.y = random() * (Math.PI / 2) - Math.PI / 4;
      updateFadePosition();
      pipe = createPipe();
      complexityFadeRequested = false;
      earlyFadeStartedAt = null;
      cycleStartedAt = performance.now();
    };

    const chooseNextMove = (activePipe: Pipe) => {
      if (activePipe.segmentsCount >= activePipe.maxSegments) return false;
      const move = chooseMove(activePipe.currentPos, activePipe.direction);
      if (!move) return false;

      addMesh(jointGeometry, activePipe.currentPos, activePipe.material);
      activePipe.direction = move.direction;
      activePipe.targetDistance = move.distance;
      activePipe.targetPos = segmentEndpoint(
        activePipe.currentPos,
        move.direction,
        move.distance,
      );
      activePipe.distanceTraveled = 0;
      activePipe.currentMesh = null;
      reservePath(activePipe.currentPos, move.direction, move.distance);
      return true;
    };

    const capPipe = (activePipe: Pipe, respawn = true) => {
      addMesh(endpointGeometry, activePipe.currentPos, activePipe.material);
      if (!respawn || shouldStartComplexityFade(dynamicMeshes.length)) {
        pipe = null;
        complexityFadeRequested = true;
        return;
      }
      pipe = createPipe();
      if (!pipe) complexityFadeRequested = true;
    };

    const advancePipe = (deltaSeconds: number) => {
      let remainingGrowth = elapsedGrowth(deltaSeconds);

      while (pipe && remainingGrowth > 0 && !complexityFadeRequested) {
        if (!pipe.currentMesh) {
          pipe.currentMesh = addMesh(pipeGeometry, pipe.currentPos, pipe.material);
          orientPipeAlongDirection(pipe.currentMesh, pipe.direction);
        }

        const distanceRemaining = pipe.targetDistance - pipe.distanceTraveled;
        const step = Math.min(distanceRemaining, remainingGrowth);
        pipe.distanceTraveled += step;
        remainingGrowth -= step;
        setPipeGrowth(pipe.currentMesh, pipe.distanceTraveled);

        if (pipe.distanceTraveled < pipe.targetDistance) continue;

        pipe.currentPos.copy(pipe.targetPos);
        pipe.segmentsCount += 1;

        if (shouldStartComplexityFade(dynamicMeshes.length)) {
          capPipe(pipe, false);
        } else if (!chooseNextMove(pipe)) {
          capPipe(pipe);
        }
      }
    };

    const renderStaticScene = () => {
      resetScene();
      for (let index = 0; index < 18; index += 1) advancePipe(0.1);
      fadeMaterial.opacity = 0;
      renderer.render(scene, camera);
    };

    const renderFrame = (timestamp: number) => {
      animationFrame = null;
      if (disposed || document.hidden || reducedMotion) return;
      const deltaSeconds = Math.min(
        lastFrameTime === null ? 0 : (timestamp - lastFrameTime) / 1_000,
        MAX_DELTA_SECONDS,
      );
      lastFrameTime = timestamp;
      if (complexityFadeRequested && earlyFadeStartedAt === null) {
        earlyFadeStartedAt = timestamp;
      }
      const fadeStartedAt = earlyFadeStartedAt ??
        cycleStartedAt + RESET_TIME_MS - FADE_DURATION_MS;
      const fadeElapsed = timestamp - fadeStartedAt;

      if (fadeElapsed >= FADE_DURATION_MS) resetScene();
      else if (fadeElapsed >= 0) {
        fadeMaterial.opacity = fadeElapsed / FADE_DURATION_MS;
      } else {
        fadeMaterial.opacity = 0;
        advancePipe(deltaSeconds);
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(renderFrame);
    };

    const startAnimation = () => {
      if (disposed || reducedMotion || document.hidden || animationFrame !== null) return;
      lastFrameTime = null;
      animationFrame = requestAnimationFrame(renderFrame);
    };

    const stopAnimation = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      lastFrameTime = null;
    };

    const resize = () => {
      if (disposed) return;
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    updateFadePosition();
    resetScene();

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      stopAnimation();
      if (reducedMotion) renderStaticScene();
      else startAnimation();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) stopAnimation();
      else if (reducedMotion) renderer.render(scene, camera);
      else startAnimation();
    };
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      stopAnimation();
      onError();
    };

    motionQuery.addEventListener("change", handleMotionChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    if (reducedMotion) renderStaticScene();
    else startAnimation();

    return () => {
      disposed = true;
      stopAnimation();
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      clearDynamicMeshes();
      scene.remove(fadeMesh, ambientLight, directionalLight);
      endpointGeometry.dispose();
      jointGeometry.dispose();
      pipeGeometry.dispose();
      fadeGeometry.dispose();
      fadeMaterial.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [onError]);

  return <div ref={containerRef} className="h-full w-full bg-black" aria-hidden="true" />;
}
