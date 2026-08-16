import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import maplibregl from 'maplibre-gl';

export interface PedestrianLayerOptions {
  routeCoords: [number, number][]; // [lng, lat][]
  speed: number;                   // Speed multiplier
  scale: number;                   // Character scale multiplier
  isPlaying: boolean;              // Play/pause
  followCam: boolean;              // Third-person chase camera
  modelUrl?: string | null;        // Optional custom .glb/.gltf/.fbx url
  onProgressUpdate?: (progress: number) => void;
  onCameraUpdate?: (lng: number, lat: number, bearing: number) => void;
}

/**
 * ThreePedestrianLayer
 * MapLibre Custom WebGL 3D Layer rendering an animated pedestrian traversing real road geometry.
 */
export class ThreePedestrianLayer {
  id = 'pedestrian-3d-layer';
  type = 'custom' as const;
  renderingMode = '3d' as const;

  private map: maplibregl.Map | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;

  // Character root group & animation
  private characterGroup: THREE.Group | null = null;
  private customModel: THREE.Object3D | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private proceduralLimbs: {
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    torso: THREE.Group;
    head: THREE.Group;
  } | null = null;

  // Road spline traversal data
  private routeCoords: [number, number][] = [];
  private segmentDistances: number[] = [];
  private totalRouteDistance = 0;
  private currentProgress = 0; // 0.0 to 1.0
  private currentHeading = 0;   // Degrees

  // Config options
  private speed = 1.0;
  private scale = 1.0;
  private isPlaying = true;
  private followCam = false;
  private modelUrl: string | null = null;

  private onProgressUpdate?: (progress: number) => void;
  private onCameraUpdate?: (lng: number, lat: number, bearing: number) => void;

  private lastTime = performance.now();
  private walkCyclePhase = 0;
  private gltfLoader = new GLTFLoader();

  constructor(options: PedestrianLayerOptions) {
    this.routeCoords = options.routeCoords || [];
    this.speed = options.speed ?? 1.0;
    this.scale = options.scale ?? 1.0;
    this.isPlaying = options.isPlaying ?? true;
    this.followCam = options.followCam ?? false;
    this.modelUrl = options.modelUrl || null;
    this.onProgressUpdate = options.onProgressUpdate;
    this.onCameraUpdate = options.onCameraUpdate;

    this.computeRouteDistances();
  }

  // Calculate cumulative geodesic distances along road segments
  private computeRouteDistances() {
    this.segmentDistances = [];
    this.totalRouteDistance = 0;

    if (this.routeCoords.length < 2) return;

    for (let i = 0; i < this.routeCoords.length - 1; i++) {
      const p1 = this.routeCoords[i];
      const p2 = this.routeCoords[i + 1];
      // Euclidean Mercator distance approximation in degrees
      const dLng = (p2[0] - p1[0]) * Math.cos(((p1[1] + p2[1]) / 2) * (Math.PI / 180));
      const dLat = p2[1] - p1[1];
      const dist = Math.hypot(dLng, dLat);
      this.segmentDistances.push(dist);
      this.totalRouteDistance += dist;
    }
  }

  public updateOptions(options: Partial<PedestrianLayerOptions>) {
    if (options.routeCoords && options.routeCoords !== this.routeCoords) {
      this.routeCoords = options.routeCoords;
      this.computeRouteDistances();
      this.currentProgress = 0;
    }
    if (options.speed !== undefined) this.speed = options.speed;
    if (options.scale !== undefined) {
      this.scale = options.scale;
      this.updateScale();
    }
    if (options.isPlaying !== undefined) this.isPlaying = options.isPlaying;
    if (options.followCam !== undefined) this.followCam = options.followCam;
    if (options.onProgressUpdate) this.onProgressUpdate = options.onProgressUpdate;
    if (options.onCameraUpdate) this.onCameraUpdate = options.onCameraUpdate;

    if (options.modelUrl !== undefined && options.modelUrl !== this.modelUrl) {
      this.modelUrl = options.modelUrl || null;
      this.loadModel();
    }
  }

  public setProgress(progress: number) {
    this.currentProgress = Math.max(0, Math.min(1, progress));
  }

  private updateScale() {
    if (!this.characterGroup) return;
    // Base unit scale in Mercator units (~1.8m height in real world)
    const baseScale = 0.00000035 * Math.max(0.5, this.scale * 3.5);
    this.characterGroup.scale.set(baseScale, baseScale, baseScale);
  }

  onAdd(map: maplibregl.Map, gl: WebGLRenderingContext) {
    this.map = map;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    dirLight.position.set(100, 150, 200);
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    fillLight.position.set(-100, -100, -50);
    this.scene.add(fillLight);

    // Root Group
    this.characterGroup = new THREE.Group();
    this.updateScale();
    this.scene.add(this.characterGroup);

    // Initialize character
    if (this.modelUrl) {
      this.loadModel();
    } else {
      this.createProceduralHumanoid();
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;
  }

  // Procedural Stylized Humanoid Avatar with fluid skeletal gait cycle
  private createProceduralHumanoid() {
    if (!this.characterGroup) return;

    // Clear existing
    while (this.characterGroup.children.length > 0) {
      this.characterGroup.remove(this.characterGroup.children[0]);
    }
    this.customModel = null;
    this.mixer = null;

    // Modern athletic styling materials
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Vibrant Cobalt
      roughness: 0.35,
      metalness: 0.15,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Warm gold tone
      roughness: 0.5,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Slate dark pants
      roughness: 0.6,
    });
    const shoesMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White sneakers
      roughness: 0.2,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark hair
      roughness: 0.8,
    });

    const root = new THREE.Group();

    // Torso Group
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.0, 0);

    const torsoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.52, 0.26),
      jacketMat
    );
    torsoMesh.position.y = 0.26;
    torsoGroup.add(torsoMesh);

    // Neck & Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.56, 0);

    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      skinMat
    );
    headMesh.position.y = 0.14;
    headGroup.add(headMesh);

    const hairMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.12, 0.24),
      hairMat
    );
    hairMesh.position.set(0, 0.22, -0.02);
    headGroup.add(hairMesh);

    torsoGroup.add(headGroup);

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(0.28, 0.48, 0);
    const leftArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.05, 0.5, 8),
      jacketMat
    );
    leftArmMesh.position.y = -0.22;
    leftArmGroup.add(leftArmMesh);
    const leftHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      skinMat
    );
    leftHand.position.y = -0.48;
    leftArmGroup.add(leftHand);
    torsoGroup.add(leftArmGroup);

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-0.28, 0.48, 0);
    const rightArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.05, 0.5, 8),
      jacketMat
    );
    rightArmMesh.position.y = -0.22;
    rightArmGroup.add(rightArmMesh);
    const rightHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      skinMat
    );
    rightHand.position.y = -0.48;
    rightArmGroup.add(rightHand);
    torsoGroup.add(rightArmGroup);

    root.add(torsoGroup);

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(0.13, 0.95, 0);
    const leftLegMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.85, 8),
      pantsMat
    );
    leftLegMesh.position.y = -0.42;
    leftLegGroup.add(leftLegMesh);
    const leftShoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, 0.22),
      shoesMat
    );
    leftShoe.position.set(0, -0.88, 0.04);
    leftLegGroup.add(leftShoe);
    root.add(leftLegGroup);

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-0.13, 0.95, 0);
    const rightLegMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.85, 8),
      pantsMat
    );
    rightLegMesh.position.y = -0.42;
    rightLegGroup.add(rightLegMesh);
    const rightShoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, 0.22),
      shoesMat
    );
    rightShoe.position.set(0, -0.88, 0.04);
    rightLegGroup.add(rightShoe);
    root.add(rightLegGroup);

    this.characterGroup.add(root);

    this.proceduralLimbs = {
      torso: torsoGroup,
      head: headGroup,
      leftArm: leftArmGroup,
      rightArm: rightArmGroup,
      leftLeg: leftLegGroup,
      rightLeg: rightLegGroup,
    };
  }

  // Load custom GLTF/GLB or FBX model
  private loadModel() {
    if (!this.modelUrl || !this.characterGroup) return;

    const isFbx = this.modelUrl.includes('.fbx') || this.modelUrl.includes('fbx');

    if (isFbx) {
      const fbxLoader = new FBXLoader();
      fbxLoader.load(
        this.modelUrl,
        (fbx) => {
          if (!this.characterGroup) return;
          while (this.characterGroup.children.length > 0) {
            this.characterGroup.remove(this.characterGroup.children[0]);
          }
          this.proceduralLimbs = null;

          fbx.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Normalize FBX height to ~1.8m
          const bbox = new THREE.Box3().setFromObject(fbx);
          const size = bbox.getSize(new THREE.Vector3());
          if (size.y > 0) {
            const normalizeScale = 1.8 / size.y;
            fbx.scale.set(normalizeScale, normalizeScale, normalizeScale);
          }

          this.customModel = fbx;
          this.characterGroup.add(fbx);

          if (fbx.animations && fbx.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(fbx);
            const walkClip =
              fbx.animations.find((a) => /walk|run|jog|march/i.test(a.name)) ||
              fbx.animations[0];
            const action = this.mixer.clipAction(walkClip);
            action.play();
          }
        },
        undefined,
        (err) => {
          console.warn('Failed to load FBX model, falling back to procedural avatar:', err);
          this.createProceduralHumanoid();
        }
      );
      return;
    }

    this.gltfLoader.load(
      this.modelUrl,
      (gltf) => {
        if (!this.characterGroup) return;
        while (this.characterGroup.children.length > 0) {
          this.characterGroup.remove(this.characterGroup.children[0]);
        }
        this.proceduralLimbs = null;

        const model = gltf.scene;
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Normalize model height to ~1.8m
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        if (size.y > 0) {
          const normalizeScale = 1.8 / size.y;
          model.scale.set(normalizeScale, normalizeScale, normalizeScale);
        }

        this.customModel = model;
        this.characterGroup.add(model);

        // Play walking animation if present
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          const walkClip =
            gltf.animations.find((a) =>
              /walk|run|jog|march/i.test(a.name)
            ) || gltf.animations[0];
          const action = this.mixer.clipAction(walkClip);
          action.play();
        }
      },
      undefined,
      (err) => {
        console.warn('Failed to load custom GLB model, falling back to procedural avatar:', err);
        this.createProceduralHumanoid();
      }
    );
  }

  // Evaluate current GPS coordinates & heading along road spline
  private getPointAtProgress(t: number): { lng: number; lat: number; heading: number } | null {
    if (this.routeCoords.length < 2 || this.totalRouteDistance === 0) {
      if (this.routeCoords.length === 1) {
        return { lng: this.routeCoords[0][0], lat: this.routeCoords[0][1], heading: 0 };
      }
      return null;
    }

    const targetDist = Math.max(0, Math.min(1, t)) * this.totalRouteDistance;
    let accumulated = 0;

    for (let i = 0; i < this.segmentDistances.length; i++) {
      const segDist = this.segmentDistances[i];
      if (accumulated + segDist >= targetDist || i === this.segmentDistances.length - 1) {
        const segProgress = segDist > 0 ? (targetDist - accumulated) / segDist : 0;
        const p1 = this.routeCoords[i];
        const p2 = this.routeCoords[i + 1];

        const lng = p1[0] + (p2[0] - p1[0]) * segProgress;
        const lat = p1[1] + (p2[1] - p1[1]) * segProgress;

        // Compute tangent heading in degrees
        const dLng = (p2[0] - p1[0]) * Math.cos(((p1[1] + p2[1]) / 2) * (Math.PI / 180));
        const dLat = p2[1] - p1[1];
        const headingRad = Math.atan2(dLng, dLat);
        const headingDeg = (headingRad * (180 / Math.PI) + 360) % 360;

        return { lng, lat, heading: headingDeg };
      }
      accumulated += segDist;
    }

    const last = this.routeCoords[this.routeCoords.length - 1];
    return { lng: last[0], lat: last[1], heading: 0 };
  }

  render(gl: WebGLRenderingContext, matrix: number[]) {
    if (!this.map || !this.scene || !this.camera || !this.renderer || !this.characterGroup) return;

    const now = performance.now();
    const deltaSec = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Advance along route if playing
    if (this.isPlaying && this.totalRouteDistance > 0) {
      // Base walking speed ~1.4 m/s in Mercator progress
      const progressIncrement = (deltaSec * 0.015 * Math.max(0.2, this.speed)) / Math.max(0.001, this.totalRouteDistance * 111);
      this.currentProgress = (this.currentProgress + progressIncrement) % 1.0;

      if (this.onProgressUpdate) {
        this.onProgressUpdate(this.currentProgress);
      }
    }

    // Evaluate position along road network
    const pt = this.getPointAtProgress(this.currentProgress);

    if (pt) {
      this.currentHeading = pt.heading;

      // Transform GPS [lng, lat] into MapLibre Mercator Coordinates
      const merc = maplibregl.MercatorCoordinate.fromLngLat([pt.lng, pt.lat], 0);

      this.characterGroup.position.set(merc.x, merc.y, merc.z);

      // Rotate character to face travel direction (+Y is North in Mercator, heading 0 = North)
      // Three.js rotation around Z axis (Zenith):
      this.characterGroup.rotation.set(Math.PI / 2, 0, -(pt.heading * Math.PI) / 180);

      // Third-Person Follow Camera Stream
      if (this.followCam && this.onCameraUpdate && this.isPlaying) {
        this.onCameraUpdate(pt.lng, pt.lat, pt.heading);
      }
    }

    // Animate character walk cycle
    if (this.isPlaying) {
      if (this.mixer) {
        this.mixer.update(deltaSec * Math.max(0.5, this.speed));
      } else if (this.proceduralLimbs) {
        // Natural humanoid kinematics: sinusoidal leg swing & counter arm swing
        this.walkCyclePhase += deltaSec * Math.PI * 2.8 * Math.max(0.5, Math.min(3, this.speed));
        const swing = Math.sin(this.walkCyclePhase) * 0.45;
        const armSwing = -swing * 0.4;
        const bounce = Math.abs(Math.sin(this.walkCyclePhase * 2)) * 0.04;

        this.proceduralLimbs.leftLeg.rotation.x = swing;
        this.proceduralLimbs.rightLeg.rotation.x = -swing;
        this.proceduralLimbs.leftArm.rotation.x = armSwing;
        this.proceduralLimbs.rightArm.rotation.x = -armSwing;
        this.proceduralLimbs.torso.position.y = 1.0 + bounce;
        this.proceduralLimbs.torso.rotation.y = Math.sin(this.walkCyclePhase) * 0.08;
      }
    }

    // Set MapLibre Projection Matrix into Three.js Camera
    const m = new THREE.Matrix4().fromArray(matrix);
    this.camera.projectionMatrix = m;

    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }

  onRemove() {
    if (this.characterGroup && this.scene) {
      this.scene.remove(this.characterGroup);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.map = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
