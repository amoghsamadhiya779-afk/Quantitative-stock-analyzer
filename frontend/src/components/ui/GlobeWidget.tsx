"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export const MARKET_LOCATIONS: Record<string, [number, number]> = {
  "United States (S&P 500)": [40.7128, -74.006],
  "India (NIFTY 50)": [19.076, 72.8777],
  "Japan (Nikkei 225)": [35.6762, 139.6503],
  "United Kingdom (FTSE 100)": [51.5074, -0.1278],
  "Germany (DAX 40)": [50.1109, 8.6821],
  "Turkey (BIST 100)": [41.0082, 28.9784],
  "Brazil (Bovespa)": [-23.5505, -46.6333],
  "Indonesia (IDX)": [-6.2088, 106.8456],
};

// Convert lat/long coordinates to 3D Cartesian coordinates on sphere
function convertLatLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);
  
  return new THREE.Vector3(x, y, z);
}

interface Props {
  activeLocation?: [number, number];
  onSelectMarket?: (marketName: string) => void;
  onHoverNode?: (name: string | null) => void;
}

export default function GlobeWidget({ activeLocation, onSelectMarket, onHoverNode }: Props) {
  return (
    <div className="w-full aspect-square relative max-w-[500px] mx-auto drop-shadow-2xl">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.6} />
        
        <GlobeScene activeLocation={activeLocation} onSelectMarket={onSelectMarket} onHoverNode={onHoverNode} />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>
    </div>
  );
}

interface NodeProps {
  name: string;
  position: THREE.Vector3;
  isActive: boolean;
  onClick: () => void;
  onHoverNode?: (name: string | null) => void;
}

function MarketNode({ name, position, isActive, onClick, onHoverNode }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);

  // Pulsing scale animation
  useFrame(({ clock }) => {
    if (ringRef.current) {
      const time = clock.getElapsedTime();
      const scale = 1 + (time % 1) * 0.8;
      ringRef.current.scale.set(scale, scale, scale);
      
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = Math.max(0, 0.8 - (time % 1));
      }
    }
  });

  return (
    <group position={position}>
      {/* Glow Center Core Mesh */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHoverNode?.(name);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHoverNode?.(null);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[isActive ? 0.12 : 0.08, 16, 16]} />
        <meshBasicMaterial 
          color={isActive ? "#10b981" : (hovered ? "#34d399" : "#3b82f6")}
          toneMapped={false}
        />
      </mesh>

      {/* Pulsing ring mesh */}
      <mesh ref={ringRef}>
        <ringGeometry args={[isActive ? 0.13 : 0.09, isActive ? 0.24 : 0.18, 32]} />
        <meshBasicMaterial
          color={isActive ? "#10b981" : "#3b82f6"}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

    </group>
  );
}

function OrbitRings({ radius }: { radius: number }) {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  // Rotate orbital bands at different speeds to resemble an enterprise AI system
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (ringRef1.current) {
      ringRef1.current.rotation.x = time * 0.05;
      ringRef1.current.rotation.y = time * 0.08;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x = -time * 0.06;
      ringRef2.current.rotation.z = time * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={ringRef1}>
        <torusGeometry args={[radius + 0.15, 0.008, 8, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} />
      </mesh>
      <mesh ref={ringRef2}>
        <torusGeometry args={[radius + 0.3, 0.004, 8, 64]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

function GlobeScene({ activeLocation, onSelectMarket, onHoverNode }: Props) {
  const globeRef = useRef<THREE.Group>(null);
  const radius = 2.2;

  // Auto-rotation
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Solid inner core mesh (hides back-side nodes) */}
      <mesh>
        <sphereGeometry args={[radius - 0.02, 32, 32]} />
        <meshBasicMaterial color="#030712" transparent opacity={0.82} />
      </mesh>

      {/* Outer grid wireframe sphere */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color="#334155"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Horizontal Latitude Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.03, radius + 0.03, 64]} />
        <meshBasicMaterial color="#475569" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* High-tech rotating rings */}
      <OrbitRings radius={radius} />
      
      {/* Active node markers */}
      {Object.entries(MARKET_LOCATIONS).map(([name, loc]) => {
        const isActive = activeLocation && activeLocation[0] === loc[0] && activeLocation[1] === loc[1];
        const pos = convertLatLngToVector3(loc[0], loc[1], radius);
        
        return (
          <MarketNode
            key={name}
            name={name}
            position={pos}
            isActive={!!isActive}
            onClick={() => onSelectMarket?.(name)}
            onHoverNode={onHoverNode}
          />
        );
      })}
    </group>
  );
}
