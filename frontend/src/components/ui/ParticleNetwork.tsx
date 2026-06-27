"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Generates 3D points from a 2D canvas text render
function getTextPoints(text: string, width: number, height: number): THREE.Vector3[] {
  // If running on server, return empty
  if (typeof document === "undefined") return [];

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
  
  // Use a very bold font for thick particles
  ctx.font = "900 180px sans-serif";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  
  const points: THREE.Vector3[] = [];
  const step = 4; // Lower = more particles
  
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      // If pixel is bright (white)
      if (data[i] > 128) {
        // Map 2D canvas coordinates to 3D space
        const px = (x - width / 2) * 0.06;
        const py = -(y - height / 2) * 0.06;
        const pz = (Math.random() - 0.5) * 2; // Subtle depth
        points.push(new THREE.Vector3(px, py, pz));
      }
    }
  }
  return points;
}

function ParticleCloud({ mousePointer }: { mousePointer: React.MutableRefObject<THREE.Vector2> }) {
  const ref = useRef<THREE.Points>(null);
  
  // 1. Get the target shape (NEXUS text)
  const targetPoints = useMemo(() => getTextPoints("NEXUS", 1024, 512), []);
  const count = targetPoints.length;
  
  // 2. Initialize current positions (spawn randomly at the bottom for anti-gravity)
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = -20 - Math.random() * 20; 
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, [count]);

  // 3. Cache the target positions for fast access in the render loop
  const targetPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = targetPoints[i]?.x || 0;
      pos[i * 3 + 1] = targetPoints[i]?.y || 0;
      pos[i * 3 + 2] = targetPoints[i]?.z || 0;
    }
    return pos;
  }, [count, targetPoints]);

  useFrame((state, delta) => {
    if (!ref.current || count === 0) return;
    const positionsAttr = ref.current.geometry.attributes.position;
    const posArray = positionsAttr.array as Float32Array;

    // Approximate mapping of normalized mouse to 3D world space
    const mx = mousePointer.current.x * 20; 
    const my = mousePointer.current.y * 10;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const tx = targetPositions[idx];
      const ty = targetPositions[idx + 1];
      const tz = targetPositions[idx + 2];

      let cx = posArray[idx];
      let cy = posArray[idx + 1];
      let cz = posArray[idx + 2];

      // Distance to mouse
      const dx = cx - mx;
      const dy = cy - my;
      const distToMouse = Math.sqrt(dx*dx + dy*dy);

      // Mouse repulsion field
      const repulsionRadius = 4;
      if (distToMouse < repulsionRadius) {
        const force = (repulsionRadius - distToMouse) / repulsionRadius;
        cx += (dx / distToMouse) * force * delta * 25;
        cy += (dy / distToMouse) * force * delta * 25;
      }

      // Magnetic pull towards the text shape
      const speed = 1.5;
      cx += (tx - cx) * delta * speed;
      cy += (ty - cy) * delta * speed;
      cz += (tz - cz) * delta * speed;

      // Anti-Gravity & Fluid Noise (subtle drifting)
      const time = state.clock.getElapsedTime();
      cx += Math.sin(time * 0.5 + i) * delta * 0.3;
      cy += Math.cos(time * 0.3 + i) * delta * 0.3;

      posArray[idx] = cx;
      posArray[idx + 1] = cy;
      posArray[idx + 2] = cz;
    }
    positionsAttr.needsUpdate = true;

    // Parallax effect based on mouse
    ref.current.rotation.y += (mousePointer.current.x * 0.1 - ref.current.rotation.y) * 0.05;
    ref.current.rotation.x += (mousePointer.current.y * 0.1 - ref.current.rotation.x) * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00f0ff"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export function ParticleNetwork() {
  const mouse = useRef(new THREE.Vector2());
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates from -1 to +1
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!mounted) return <div className="fixed inset-0 z-[-1] bg-[#030305]" />;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0a0a0a]">
      {/* Dynamic 3D WebGL Canvas */}
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <fog attach="fog" args={["#0a0a0a", 5, 25]} />
        <ParticleCloud mousePointer={mouse} />
      </Canvas>

      {/* Optical Flares / Horizon glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at bottom, rgba(0, 150, 255, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at top right, rgba(255, 120, 0, 0.1) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Premium film grain overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
