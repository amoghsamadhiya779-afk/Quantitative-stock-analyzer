"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

export default function Scene() {
  return (
    <div className="absolute inset-0 -z-10 w-full h-full bg-background transition-colors duration-1000">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <fog attach="fog" args={["#030712", 1, 2]} />
        <ambientLight intensity={0.5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
