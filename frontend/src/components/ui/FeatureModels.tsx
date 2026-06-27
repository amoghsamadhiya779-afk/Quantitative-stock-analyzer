"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WebGLOrchestrator } from "../../lib/WebGLOrchestrator";

// 1. Backtesting: Floating Candlesticks (Optimized with instancedMesh and pooled assets)
export function BacktestModel() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 15;

  const orchestrator = WebGLOrchestrator.getInstance();
  const geometry = orchestrator.getGeometry("backtest-geom", () => new THREE.BoxGeometry(0.2, 1, 0.2));
  const material = orchestrator.getMaterial("backtest-mat", () => new THREE.MeshStandardMaterial({ wireframe: true }));

  // Generate static offsets and heights
  const sticks = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const height = Math.random() * 2 + 1;
      const z = (Math.random() - 0.5) * 2;
      const colorStr = i % 2 === 0 ? "#10b981" : "#ef4444";
      return {
        x: (i - 7) * 0.4,
        z,
        height,
        color: new THREE.Color(colorStr),
      };
    });
  }, [count]);

  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    sticks.forEach((stick, i) => {
      const y = Math.sin(state.clock.elapsedTime * 2 + i) * 0.5;
      tempObject.position.set(stick.x, y, stick.z);
      tempObject.scale.set(1, stick.height, 1);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      meshRef.current!.setColorAt(i, stick.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
}

// 2. Risk Analytics: Pulsing Wireframe Sphere (Optimized with pooled assets)
export function RiskModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const orchestrator = WebGLOrchestrator.getInstance();
  const geometry = orchestrator.getGeometry("risk-geom", () => new THREE.SphereGeometry(2, 16, 16));
  const material = orchestrator.getMaterial("risk-mat", () => new THREE.MeshStandardMaterial({
    color: "#ef4444",
    wireframe: true,
    transparent: true,
    opacity: 0.6,
  }));

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

// 3. Portfolio: Complex Torus Knot (Optimized with pooled assets, reduced segments to 48 and 8)
export function PortfolioModel() {
  const meshRef = useRef<THREE.Mesh>(null);

  const orchestrator = WebGLOrchestrator.getInstance();
  const geometry = orchestrator.getGeometry("portfolio-geom", () => new THREE.TorusKnotGeometry(1.2, 0.4, 48, 8));
  const material = orchestrator.getMaterial("portfolio-mat", () => new THREE.MeshStandardMaterial({
    color: "#3b82f6",
    wireframe: true,
  }));

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

// 4. ML Predictions: Neural Node Cloud (Optimized with pooled assets)
export function MLModel() {
  const ref = useRef<THREE.Points>(null);
  const count = 200;

  const orchestrator = WebGLOrchestrator.getInstance();
  const geometry = orchestrator.getGeometry("ml-geom", () => {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geom;
  });

  const material = orchestrator.getMaterial("ml-mat", () => new THREE.PointsMaterial({
    color: "#a855f7",
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
  }));

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.2;
      ref.current.rotation.x += delta * 0.1;
    }
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

// 5. Tech Indicators: Moving Sine Wave (Optimized with instancedMesh and pooled assets)
export function IndicatorModel() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 50;

  const orchestrator = WebGLOrchestrator.getInstance();
  const geometry = orchestrator.getGeometry("indicator-geom", () => new THREE.SphereGeometry(0.05, 8, 8));
  const material = orchestrator.getMaterial("indicator-mat", () => new THREE.MeshStandardMaterial({
    color: "#0ea5e9",
    emissive: "#0ea5e9",
    emissiveIntensity: 2,
  }));

  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const x = (i - count / 2) * 0.1;
      const y = Math.sin(state.clock.elapsedTime * 3 + x * 2);
      tempObject.position.set(x, y, 0);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
}

// 6. Live News: Data Stream Cubes (Optimized with instancedMesh and pooled assets)
export function NewsModel() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 40;

  const orchestrator = WebGLOrchestrator.getInstance();
  const geometry = orchestrator.getGeometry("news-geom", () => new THREE.BoxGeometry(0.15, 0.15, 0.15));
  const material = orchestrator.getMaterial("news-mat", () => new THREE.MeshStandardMaterial({
    color: "#f59e0b",
    wireframe: true,
  }));

  // Initialize random positions and rotation vectors
  const cubes = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 6,
      z: (Math.random() - 0.5) * 4,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rotSpeedX: Math.random() * 0.5 + 0.5,
      rotSpeedY: Math.random() * 0.5 + 0.5,
    }));
  }, [count]);

  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    cubes.forEach((cube, i) => {
      cube.y -= delta * 2;
      cube.rx += delta * cube.rotSpeedX;
      cube.ry += delta * cube.rotSpeedY;

      if (cube.y < -3) {
        cube.y = 3;
        cube.x = (Math.random() - 0.5) * 4;
        cube.z = (Math.random() - 0.5) * 4;
      }

      tempObject.position.set(cube.x, cube.y, cube.z);
      tempObject.rotation.set(cube.rx, cube.ry, 0);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
}
