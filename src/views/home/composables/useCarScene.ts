import { gsap } from 'gsap';
import {
  Box3,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
  ACESFilmicToneMapping
} from 'three';
import type { Material, Object3D } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue';
import type { CarCameraView, CarPaintId, CarPaintOption } from '../types';

// Composable 使用配置对象集中声明响应式输入和回调，避免多个位置参数难以维护。
interface UseCarSceneOptions {
  /** Three.js Canvas 的挂载容器。 */
  containerRef: Readonly<Ref<HTMLElement | null>>;
  /** 当前车漆响应式引用。 */
  activePaint: Readonly<Ref<CarPaintId>>;
  /** 当前镜头预设响应式引用。 */
  activeView: Readonly<Ref<CarCameraView>>;
  /** 自动旋转开关响应式引用。 */
  autoRotate: Readonly<Ref<boolean>>;
  /** 相机距离缩放比例响应式引用。 */
  zoomScale: Readonly<Ref<number>>;
  /** 可用车漆及其 PBR 参数。 */
  paints: readonly CarPaintOption[];
  /** 模型网络加载进度回调，取值为 0—100。 */
  onProgress: (progress: number) => void;
  /** 场景已完成模型装配的回调。 */
  onReady: () => void;
  /** 模型加载失败时的用户提示回调。 */
  onError: (message: string) => void;
  /** OrbitControls 开始交互时的回调。 */
  onInteract: () => void;
}

// 每个镜头同时定义相机位置和观察中心，保证切换时构图可复现。
interface CameraPose {
  /** 相机在归一化车型坐标系中的三维位置。 */
  position: [number, number, number];
  /** 相机需要持续注视的三维目标点。 */
  target: [number, number, number];
}

// 镜头位置使用统一的车体归一化坐标，切换车型时仍能保持稳定构图。
const CAMERA_POSES: Record<CarCameraView, CameraPose> = {
  // 默认英雄镜头从右前上方观察车型。
  hero: { position: [7.6, 3.8, 8.4], target: [0, 1.05, 0] },
  // 正面镜头沿模型正 Z 轴观察车头。
  front: { position: [0, 2.25, 10.6], target: [0, 0.95, 0] },
  // 侧面镜头沿模型正 X 轴展示车身比例。
  side: { position: [10.8, 2.4, 0.1], target: [0, 0.95, 0] },
  // 后方镜头沿模型负 Z 轴观察车尾。
  rear: { position: [0, 2.35, -10.6], target: [0, 0.95, 0] }
};

// 模型放在 public 下，生产构建后仍可通过根路径直接请求。
const MODEL_URL = '/models/car-concept/CarConcept.glb';

// 材质可能被多个网格共享，用 Set 去重可以避免重复写入和重复销毁。
const getUniqueMaterials = (material: Material | Material[]) => (Array.isArray(material) ? material : [material]);

export function useCarScene(options: UseCarSceneOptions) {
  // Three.js 实例使用普通变量保存，避免 Vue 代理复杂类对象造成额外开销。
  let renderer: WebGLRenderer | undefined;
  let scene: Scene | undefined;
  let camera: PerspectiveCamera | undefined;
  let controls: OrbitControls | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let animationFrame = 0;
  let modelRoot: Group | undefined;
  let environmentTexture: Texture | undefined;
  let cameraTimeline: gsap.core.Timeline | undefined;
  let cameraBaseDistance = 1;

  // 三个 Set 分别记录可换色材质、全部材质和几何体，供更新与卸载阶段去重处理。
  const paintMaterials = new Set<MeshStandardMaterial>();
  const sceneMaterials = new Set<Material>();
  const sceneGeometries = new Set<{ dispose: () => void }>();

  // 根据配置项更新真实 PBR 材质，同时保留模型原有的颗粒法线和清漆纹理。
  const applyPaint = (paintId: CarPaintId) => {
    const paint = options.paints.find((item) => item.id === paintId);
    if (!paint) return;

    paintMaterials.forEach((material) => {
      material.color.setHex(paint.hex, SRGBColorSpace);
      material.metalness = paint.metalness;
      material.roughness = paint.roughness;

      // 物理材质额外加强清漆层，让颜色切换后仍保持汽车漆的高光深度。
      if (material instanceof MeshPhysicalMaterial) {
        material.clearcoat = 1;
        material.clearcoatRoughness = Math.min(0.16, paint.roughness * 0.5);
      }
      material.needsUpdate = true;
    });
  };

  // 预设视角通过同一条 GSAP 时间线移动相机与观察点，避免画面产生跳变。
  const moveCamera = (view: CarCameraView, immediate = false) => {
    if (!camera || !controls) return;
    const pose = CAMERA_POSES[view];
    const targetPosition = new Vector3(...pose.target);
    cameraBaseDistance = new Vector3(...pose.position).distanceTo(targetPosition);
    // 预设视角只改变观察方向，当前按钮缩放比例会继续作用于相机距离。
    const cameraPosition = new Vector3(...pose.position).sub(targetPosition).multiplyScalar(options.zoomScale.value).add(targetPosition);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = immediate || reduceMotion ? 0 : 1.15;

    cameraTimeline?.kill();
    cameraTimeline = gsap.timeline({ defaults: { duration, ease: 'power3.inOut', overwrite: 'auto' } });
    cameraTimeline.to(camera.position, { x: cameraPosition.x, y: cameraPosition.y, z: cameraPosition.z }, 0);
    cameraTimeline.to(
      controls.target,
      {
        x: pose.target[0],
        y: pose.target[1],
        z: pose.target[2],
        onUpdate: () => controls?.update()
      },
      0
    );
  };

  // 缩放沿当前观察射线移动相机，因此不会重置用户拖拽得到的环绕角度。
  const zoomCamera = (scale: number) => {
    if (!camera || !controls) return;
    // 使用基础镜头距离计算绝对终点，快速连续点击时也不会累积动画中间态误差。
    const destination = camera.position
      .clone()
      .sub(controls.target)
      .normalize()
      .multiplyScalar(cameraBaseDistance * scale)
      .add(controls.target);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    cameraTimeline?.kill();
    cameraTimeline = gsap.timeline({ defaults: { duration: reduceMotion ? 0 : 0.55, ease: 'power3.out', overwrite: 'auto' } });
    cameraTimeline.to(camera.position, {
      x: destination.x,
      y: destination.y,
      z: destination.z,
      onUpdate: () => controls?.update()
    });
  };

  // 将不同来源的模型归一到固定展台尺寸，页面无需依赖模型的原始单位和原点。
  const normalizeModel = (root: Group) => {
    const initialBox = new Box3().setFromObject(root);
    const initialSize = initialBox.getSize(new Vector3());
    const longestSide = Math.max(initialSize.x, initialSize.y, initialSize.z);
    const scale = longestSide > 0 ? 6.8 / longestSide : 1;
    root.scale.setScalar(scale);

    const scaledBox = new Box3().setFromObject(root);
    const center = scaledBox.getCenter(new Vector3());
    root.position.set(-center.x, 0.16 - scaledBox.min.y, -center.z);
  };

  // 遍历车体时一次性登记阴影、可切换车漆和卸载阶段需要释放的 GPU 资源。
  const prepareModel = (root: Group) => {
    root.traverse((object: Object3D) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      sceneGeometries.add(object.geometry);

      getUniqueMaterials(object.material).forEach((material) => {
        sceneMaterials.add(material);
        if (material instanceof MeshStandardMaterial && /^Paint [12] Carmine$/i.test(material.name)) {
          paintMaterials.add(material);
        }
      });
    });
  };

  // 展台与接触阴影用于给透明 Canvas 提供空间锚点，不额外加载环境贴图。
  const createStudioFloor = (targetScene: Scene) => {
    const platformMaterial = new MeshStandardMaterial({ color: 0x11161d, metalness: 0.38, roughness: 0.58 });
    const platformGeometry = new CylinderGeometry(5.2, 5.55, 0.15, 96);
    const platform = new Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0;
    platform.receiveShadow = true;

    const shadowMaterial = new ShadowMaterial({ color: 0x000000, opacity: 0.42 });
    const shadowGeometry = new PlaneGeometry(18, 18);
    const shadowPlane = new Mesh(shadowGeometry, shadowMaterial);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.08;
    shadowPlane.receiveShadow = true;

    targetScene.add(platform, shadowPlane);
    // Set.add 每次只登记一个资源，确保两个展台对象都能在卸载时释放。
    sceneMaterials.add(platformMaterial);
    sceneMaterials.add(shadowMaterial);
    sceneGeometries.add(platformGeometry);
    sceneGeometries.add(shadowGeometry);
  };

  // ResizeObserver 只在容器尺寸真正变化时更新相机和渲染缓冲区。
  const resizeScene = () => {
    const container = options.containerRef.value;
    if (!container || !renderer || !camera) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  // 渲染循环在标签页隐藏时跳过 GPU 绘制，但保留下一帧调度以便恢复后继续运行。
  const renderScene = () => {
    animationFrame = window.requestAnimationFrame(renderScene);
    if (document.hidden || !renderer || !scene || !camera) return;
    controls?.update();
    renderer.render(scene, camera);
  };

  // 释放材质引用的纹理，避免多次进入首页后持续占用显存。
  const disposeMaterial = (material: Material) => {
    Object.values(material).forEach((value) => {
      if (value instanceof Texture) value.dispose();
    });
    material.dispose();
  };

  // 初始化必须在组件挂载后执行，此时 Canvas 容器才拥有真实尺寸并可插入 DOM。
  const initScene = () => {
    const container = options.containerRef.value;
    if (!container) return;

    // 透明高性能渲染器允许 DOM 背景、标题和 WebGL 车身进行前后景叠加。
    scene = new Scene();
    camera = new PerspectiveCamera(36, 1, 0.1, 120);
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.domElement.className = 'car-stage__canvas';
    renderer.domElement.setAttribute('aria-label', '可拖拽旋转的 3D 概念车');
    container.appendChild(renderer.domElement);

    // RoomEnvironment 在本地生成摄影棚反射，兼顾金属质感和离线可用性。
    const pmremGenerator = new PMREMGenerator(renderer);
    environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environmentTexture;
    pmremGenerator.dispose();

    // 半球光提供环境亮度，主光制造车身高光，轮廓光分离暗部与背景。
    const hemisphereLight = new HemisphereLight(0xcfe9ff, 0x07080c, 1.7);
    const keyLight = new DirectionalLight(0xffffff, 4.8);
    keyLight.position.set(6, 9, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 30;
    const rimLight = new DirectionalLight(0x9fc6ff, 2.8);
    rimLight.position.set(-8, 4, -7);
    scene.add(hemisphereLight, keyLight, rimLight);

    createStudioFloor(scene);

    // OrbitControls 只开放环绕旋转；平移和滚轮缩放关闭，避免破坏构图与页面滚动。
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    // 汽车章节处于长滚动首页中，关闭滚轮缩放可避免 OrbitControls 阻断页面滚动。
    controls.enableZoom = false;
    controls.minDistance = 6.2;
    controls.maxDistance = 15;
    controls.minPolarAngle = MathUtils.degToRad(50);
    controls.maxPolarAngle = MathUtils.degToRad(82);
    controls.autoRotate = options.autoRotate.value;
    controls.autoRotateSpeed = 0.62;
    // 允许移动端纵向手势交给页面，横向拖动仍可用于旋转车身。
    renderer.domElement.style.touchAction = 'pan-y';
    controls.addEventListener('start', options.onInteract);

    // 初始镜头立即定位，后续视角变化再使用 GSAP 过渡。
    moveCamera(options.activeView.value, true);
    resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(container);
    resizeScene();
    renderScene();

    // GLTFLoader 以异步方式解析几何、材质与贴图，并把网络进度反馈给 Vue 加载层。
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf: GLTF) => {
        // 模型加载成功后依次归一尺寸、登记资源、加入场景并应用当前车漆。
        modelRoot = gltf.scene;
        normalizeModel(modelRoot);
        prepareModel(modelRoot);
        scene?.add(modelRoot);
        applyPaint(options.activePaint.value);
        options.onProgress(100);
        options.onReady();
      },
      (event) => {
        // Content-Length 缺失时保留当前进度，避免加载条出现 NaN。
        if (event.total > 0) options.onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      },
      (error) => {
        // 控制台保留原始异常便于排查，界面只暴露可理解的用户提示。
        console.error('[CarScene] 模型加载失败：', error);
        options.onError('3D 模型加载失败，请刷新页面重试');
      }
    );
  };

  // Vue 状态变化只触发对应的 Three.js 副作用，避免为一次操作重建整个场景。
  watch(options.activePaint, (paintId) => applyPaint(paintId));
  watch(options.activeView, (view) => moveCamera(view));
  watch(options.zoomScale, (scale) => zoomCamera(scale));
  watch(options.autoRotate, (enabled) => {
    if (controls) controls.autoRotate = enabled;
  });

  // Vue 生命周期负责启动和回收 WebGL 场景，路由切换时不会遗留动画帧。
  onMounted(initScene);

  onBeforeUnmount(() => {
    // 先停止循环和事件，再依次释放几何、材质、纹理与渲染器占用的 GPU 资源。
    window.cancelAnimationFrame(animationFrame);
    cameraTimeline?.kill();
    resizeObserver?.disconnect();
    controls?.removeEventListener('start', options.onInteract);
    controls?.dispose();
    modelRoot?.removeFromParent();
    sceneGeometries.forEach((geometry) => geometry.dispose());
    sceneMaterials.forEach(disposeMaterial);
    environmentTexture?.dispose();
    renderer?.dispose();
    renderer?.domElement.remove();
    paintMaterials.clear();
  });
}
