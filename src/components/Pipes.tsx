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
};

const GRID_SIZE = 20;
const BOUNDS = 400;
const PIPE_RADIUS = 8;
const SPEED_PER_SECOND = 1_200;
const RESET_TIME_MS = 32_000;
const FADE_DURATION_MS = 1_000;
const MAX_DYNAMIC_MESHES = 256;
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

const DIRECTIONS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

function random() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 2 ** 32;
}

function randomInt(min: number, max: number) {
  return Math.round(random() * (max - min) + min);
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
    pipeGeometry.translate(0, 0.5, 0);
    pipeGeometry.rotateX(Math.PI / 2);
    const fadeGeometry = new THREE.PlaneGeometry(2_000, 2_000);
    const pipeMaterial = new THREE.MeshPhongMaterial({
      color: PIPE_COLORS[Math.floor(random() * PIPE_COLORS.length)],
      shininess: 30,
      specular: 0x3f3f3f,
    });
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
    let pipe: Pipe | null = null;

    const positionKey = (position: THREE.Vector3) =>
      `${Math.round(position.x)},${Math.round(position.y)},${Math.round(position.z)}`;

    const updateFadePosition = () => {
      fadeMesh.position
        .set(0, 0, 790)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), -scene.rotation.y);
      fadeMesh.rotation.y = -scene.rotation.y;
    };

    const addMesh = (geometry: THREE.BufferGeometry, position: THREE.Vector3) => {
      const mesh = new THREE.Mesh(geometry, pipeMaterial);
      mesh.position.copy(position);
      scene.add(mesh);
      dynamicMeshes.push(mesh);
      return mesh;
    };

    const clearDynamicMeshes = () => {
      for (const mesh of dynamicMeshes) scene.remove(mesh);
      dynamicMeshes.length = 0;
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
        (direction) => !current || !direction.equals(current.clone().negate()),
      ).sort(() => random() - 0.5);

      for (const direction of choices) {
        const distance = randomInt(2, 6) * GRID_SIZE;
        if (isPathClear(start, direction, distance)) return { direction, distance };
      }
      return null;
    };

    const createPipe = (): Pipe | null => {
      let start = new THREE.Vector3();
      let available = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        start = new THREE.Vector3(
          Math.floor((random() * BOUNDS - BOUNDS / 2) / GRID_SIZE) * GRID_SIZE,
          Math.floor((random() * BOUNDS - BOUNDS / 2) / GRID_SIZE) * GRID_SIZE,
          Math.floor((random() * BOUNDS - BOUNDS / 2) / GRID_SIZE) * GRID_SIZE,
        );
        if (!occupiedPositions.has(positionKey(start))) {
          available = true;
          break;
        }
      }
      if (!available) return null;

      const move = chooseMove(start);
      if (!move) return null;
      occupiedPositions.add(positionKey(start));
      reservePath(start, move.direction, move.distance);
      addMesh(endpointGeometry, start);

      return {
        currentPos: start,
        direction: move.direction,
        targetPos: start.clone().add(move.direction.clone().multiplyScalar(move.distance)),
        currentMesh: null,
        distanceTraveled: 0,
        targetDistance: move.distance,
        segmentsCount: 0,
        maxSegments: randomInt(40, 120),
      };
    };

    const resetScene = () => {
      clearDynamicMeshes();
      occupiedPositions.clear();
      fadeMaterial.opacity = 0;
      pipeMaterial.color.setHex(
        PIPE_COLORS[Math.floor(random() * PIPE_COLORS.length)],
      );
      scene.rotation.y = random() * (Math.PI / 2) - Math.PI / 4;
      updateFadePosition();
      pipe = createPipe();
      cycleStartedAt = performance.now();
    };

    const chooseNextMove = (activePipe: Pipe) => {
      if (activePipe.segmentsCount >= activePipe.maxSegments) return false;
      const move = chooseMove(activePipe.currentPos, activePipe.direction);
      if (!move) return false;

      addMesh(jointGeometry, activePipe.currentPos);
      activePipe.direction = move.direction;
      activePipe.targetDistance = move.distance;
      activePipe.targetPos = activePipe.currentPos
        .clone()
        .add(move.direction.clone().multiplyScalar(move.distance));
      activePipe.distanceTraveled = 0;
      activePipe.currentMesh = null;
      reservePath(activePipe.currentPos, move.direction, move.distance);
      return true;
    };

    const advancePipe = (deltaSeconds: number) => {
      if (!pipe) return;
      if (!pipe.currentMesh) {
        pipe.currentMesh = addMesh(pipeGeometry, pipe.currentPos);
        pipe.currentMesh.lookAt(pipe.currentPos.clone().add(pipe.direction));
      }

      pipe.distanceTraveled += SPEED_PER_SECOND * deltaSeconds;
      if (pipe.distanceTraveled < pipe.targetDistance) {
        pipe.currentMesh.scale.z = pipe.distanceTraveled;
        return;
      }

      pipe.currentMesh.scale.z = pipe.targetDistance;
      pipe.currentPos.copy(pipe.targetPos);
      pipe.segmentsCount += 1;
      if (!chooseNextMove(pipe)) {
        addMesh(endpointGeometry, pipe.currentPos);
        pipe = createPipe();
      }
      if (dynamicMeshes.length >= MAX_DYNAMIC_MESHES) resetScene();
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
      const elapsed = timestamp - cycleStartedAt;

      if (elapsed >= RESET_TIME_MS) resetScene();
      else if (RESET_TIME_MS - elapsed <= FADE_DURATION_MS) {
        fadeMaterial.opacity = 1 - (RESET_TIME_MS - elapsed) / FADE_DURATION_MS;
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
      pipeMaterial.dispose();
      fadeMaterial.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [onError]);

  return <div ref={containerRef} className="h-full w-full bg-black" aria-hidden="true" />;
}
