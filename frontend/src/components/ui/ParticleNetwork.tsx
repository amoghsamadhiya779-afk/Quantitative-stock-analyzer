"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Random point generator for a sphere
function randomPointsOnSphere(count: number, radius: number) {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;

    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    points[i * 3] = r * sinPhi * cosTheta;
    points[i * 3 + 1] = r * sinPhi * sinTheta;
    points[i * 3 + 2] = r * cosPhi;
  }
  return points;
}

function ParticleCloud({ count, mousePointer }: { count: number; mousePointer: React.MutableRefObject<THREE.Vector2> }) {
  const ref = useRef<THREE.Points>(null);
  
  // Generate random points in a massive sphere around the user
  const sphere = useMemo(() => randomPointsOnSphere(count, 15), [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      // Base slow rotation
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;

      // Parallax effect based on mouse
      const targetX = mousePointer.current.x * 0.2;
      const targetY = mousePointer.current.y * 0.2;
      
      // Smooth interpolation for mouse movement
      ref.current.rotation.y += (targetX - ref.current.rotation.y) * 0.05;
      ref.current.rotation.x += (targetY - ref.current.rotation.x) * 0.05;
    }
  });

  return (
    <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00f0ff"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
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
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <fog attach="fog" args={["#0a0a0a", 5, 20]} />
        <ParticleCloud count={8000} mousePointer={mouse} />
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
