import * as THREE from "three";

export class WebGLOrchestrator {
  private static instance: WebGLOrchestrator;
  private geometries: Map<string, THREE.BufferGeometry> = new Map();
  private materials: Map<string, THREE.Material> = new Map();

  private constructor() {}

  public static getInstance(): WebGLOrchestrator {
    if (!WebGLOrchestrator.instance) {
      WebGLOrchestrator.instance = new WebGLOrchestrator();
    }
    return WebGLOrchestrator.instance;
  }

  public getGeometry<T extends THREE.BufferGeometry>(key: string, creator: () => T): T {
    if (!this.geometries.has(key)) {
      this.geometries.set(key, creator());
    }
    return this.geometries.get(key) as T;
  }

  public getMaterial<T extends THREE.Material>(key: string, creator: () => T): T {
    if (!this.materials.has(key)) {
      this.materials.set(key, creator());
    }
    return this.materials.get(key) as T;
  }

  public dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.geometries.clear();
    this.materials.forEach((m) => m.dispose());
    this.materials.clear();
  }
}
