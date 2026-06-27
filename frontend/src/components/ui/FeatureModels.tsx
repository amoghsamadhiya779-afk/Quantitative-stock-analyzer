"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, TorusKnot, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// 1. Backtesting: Floating Candlesticks
export function BacktestModel() {
  const group = useRef<THREE.Group>(null);
  const sticks = useMemo(() => Array.from({ length: 15 }), []);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.2;
      group.current.children.forEach((child, i) => {
        child.position.y = Math.sin(state.clock.elapsedTime * 2 + i) * 0.5;
      });
    }
  });

  return (
    <group ref={group}>
      {sticks.map((_, i) => (
        <mesh key={i} position={[(i - 7) * 0.4, 0, (Math.random() - 0.5) * 2]}>
          <boxGeometry args={[0.2, Math.random() * 2 + 1, 0.2]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#10b981" : "#ef4444"} wireframe />
        </mesh>
      ))}
    </group>
  );
}

// 2. Risk Analytics: Pulsing Wireframe Sphere
export function RiskModel() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.3;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.4;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      mesh.current.scale.set(scale, scale, scale);
    }
  });
  return (
    <Sphere ref={mesh} args={[2, 16, 16]}>
      <meshStandardMaterial color="#ef4444" wireframe transparent opacity={0.6} />
    </Sphere>
  );
}

// 3. Portfolio: Complex Torus Knot
export function PortfolioModel() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.5;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  return (
    <TorusKnot ref={mesh} args={[1.2, 0.4, 128, 16]}>
      <meshStandardMaterial color="#3b82f6" wireframe />
    </TorusKnot>
  );
}

// 4. ML Predictions: Neural Node Cloud
export function MLModel() {
  const ref = useRef<THREE.Points>(null);
  const count = 200;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.2;
      ref.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial transparent color="#a855f7" size={0.1} sizeAttenuation depthWrite={false} />
    </Points>
  );
}

// 5. Tech Indicators: Moving Sine Wave
export function IndicatorModel() {
  const group = useRef<THREE.Group>(null);
  const count = 50;

  useFrame((state) => {
    if (group.current) {
      group.current.children.forEach((child, i) => {
        const x = (i - count / 2) * 0.1;
        child.position.y = Math.sin(state.clock.elapsedTime * 3 + x * 2);
      });
    }
  });

  return (
    <group ref={group}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[(i - count / 2) * 0.1, 0, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

// 6. Live News: Data Stream Cubes
export function NewsModel() {
  const group = useRef<THREE.Group>(null);
  const cubes = useMemo(() => Array.from({ length: 40 }), []);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.children.forEach((child) => {
        child.position.y -= delta * 2;
        child.rotation.x += delta;
        child.rotation.y += delta;
        if (child.position.y < -3) {
          child.position.y = 3;
          child.position.x = (Math.random() - 0.5) * 4;
          child.position.z = (Math.random() - 0.5) * 4;
        }
      });
    }
  });

  return (
    <group ref={group}>
      {cubes.map((_, i) => (
        <mesh 
          key={i} 
          position={[(Math.random() - 0.5) * 4, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4]}
        >
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshStandardMaterial color="#f59e0b" wireframe />
        </mesh>
      ))}
    </group>
  );
}
