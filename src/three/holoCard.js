import * as THREE from "three";
import {
    CARD_H,
    CARD_RADIUS,
    CARD_W,
    IMAGE_RECT,
    createCanvas,
    drawCardBack,
    drawCardFront,
    loadCardImage,
    radialCanvas,
    waitForFonts,
} from "./cardTextures";

// Kích thước thẻ trong không gian 3D (cùng tỉ lệ với canvas 1000x1400)
const WIDTH = 2.5;
const HEIGHT = (WIDTH * CARD_H) / CARD_W;
const RADIUS = (CARD_RADIUS / CARD_W) * WIDTH;
const THICKNESS = 0.035;

const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormalW;
    varying vec3 vViewW;
    void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewW = cameraPosition - worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

// Ánh foil (xanh ↔ tím, rất nhẹ) + điểm sáng chạy theo con trỏ + viền sáng theo góc nhìn.
const fragmentShader = /* glsl */ `
    uniform sampler2D uMap;
    uniform vec2 uPointer;
    uniform float uHover;
    uniform float uTime;
    uniform float uFoil;
    uniform vec4 uImgRect;
    varying vec2 vUv;
    varying vec3 vNormalW;
    varying vec3 vViewW;

    float rectMask(vec2 uv, vec4 r) {
        vec2 a = smoothstep(r.xy, r.xy + 0.004, uv);
        vec2 b = 1.0 - smoothstep(r.zw - 0.004, r.zw, uv);
        return a.x * a.y * b.x * b.y;
    }

    void main() {
        vec4 base = texture2D(uMap, vUv);
        vec3 n = normalize(vNormalW);
        vec3 v = normalize(vViewW);
        float fresnel = pow(1.0 - clamp(abs(dot(n, v)), 0.0, 1.0), 2.5);

        // foil yếu trên vùng ảnh, mạnh hơn trên khung
        float onImage = rectMask(vUv, uImgRect);
        float foil = mix(0.5, 0.12, onImage) * uFoil;

        float t = (vUv.x * 0.9 + vUv.y * 0.6) + uPointer.x * 0.35 - uPointer.y * 0.25 + uTime * 0.03;
        vec3 cool = mix(vec3(0.23, 0.69, 0.94), vec3(0.70, 0.26, 0.85), 0.5 + 0.5 * sin(t * 6.2831));
        float sheen = foil * (0.05 + fresnel * 0.35 + uHover * 0.06);

        // điểm sáng (glare) theo con trỏ
        vec2 glarePos = vec2(0.5 + uPointer.x * 0.45, 0.5 + uPointer.y * 0.45);
        vec2 d = (vUv - glarePos) * vec2(1.0, 1.4);
        float glare = pow(max(0.0, 1.0 - length(d) * 1.7), 3.0) * (0.10 + 0.22 * uHover);

        vec3 color = base.rgb + cool * sheen + vec3(glare);
        gl_FragColor = vec4(color, 1.0);
    }
`;

function roundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
}

function faceGeometry(shape) {
    const geo = new THREE.ShapeGeometry(shape, 16);
    // ShapeGeometry đặt uv = toạ độ shape -> chuẩn hoá về 0..1
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, (pos.getX(i) + WIDTH / 2) / WIDTH, (pos.getY(i) + HEIGHT / 2) / HEIGHT);
    }
    uv.needsUpdate = true;
    return geo;
}

function makeTexture(canvas, renderer) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
}

const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/**
 * Tạo thẻ bài 3D trong `container`. Trả về {setCard, dispose}.
 * Ném lỗi nếu trình duyệt không hỗ trợ WebGL.
 */
export function createHoloCard(container, canvas, {onHoverChange} = {}) {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, -0.15, 9);
    camera.lookAt(0, -0.15, 0);

    // --- Thẻ bài ---
    const shape = roundedRectShape(WIDTH, HEIGHT, RADIUS);
    const faceGeo = faceGeometry(shape);
    const edgeGeo = new THREE.ExtrudeGeometry(shape, {depth: THICKNESS, bevelEnabled: false, curveSegments: 16});
    edgeGeo.translate(0, 0, -THICKNESS / 2);

    const imgRect = new THREE.Vector4(
        IMAGE_RECT.x / CARD_W,
        1 - (IMAGE_RECT.y + IMAGE_RECT.h) / CARD_H,
        (IMAGE_RECT.x + IMAGE_RECT.w) / CARD_W,
        1 - IMAGE_RECT.y / CARD_H
    );

    // Double buffer cho mặt trước: vẽ NFT mới vào buffer ẩn rồi đổi khi thẻ quay lưng lại
    const buffers = [0, 1].map(() => {
        const c = createCanvas();
        return {canvas: c, texture: makeTexture(c, renderer)};
    });
    let active = 0;
    const backCanvas = createCanvas();
    drawCardBack(backCanvas);
    const backTexture = makeTexture(backCanvas, renderer);

    const makeFaceMaterial = (map, foil, rect) =>
        new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uMap: {value: map},
                uPointer: {value: new THREE.Vector2()},
                uHover: {value: 0},
                uTime: {value: 0},
                uFoil: {value: foil},
                uImgRect: {value: rect},
            },
        });
    const frontMat = makeFaceMaterial(buffers[0].texture, 1, imgRect);
    const backMat = makeFaceMaterial(backTexture, 0.6, new THREE.Vector4(0, 0, 0, 0));
    const capMat = new THREE.MeshBasicMaterial({color: "#1d1d22"});
    const edgeMat = new THREE.MeshBasicMaterial({color: "#4a4a5a"});

    const front = new THREE.Mesh(faceGeo, frontMat);
    front.position.z = THICKNESS / 2 + 0.001;
    const back = new THREE.Mesh(faceGeo, backMat);
    back.rotation.y = Math.PI;
    back.position.z = -THICKNESS / 2 - 0.001;
    const edge = new THREE.Mesh(edgeGeo, [capMat, edgeMat]);

    const card = new THREE.Group();
    card.add(front, back, edge);
    const pivot = new THREE.Group();
    pivot.add(card);
    scene.add(pivot);

    // --- Quầng sáng phía sau + bóng đổ ---
    const glowTex = new THREE.CanvasTexture(
        radialCanvas([
            [0, "rgba(80,150,255,0.40)"],
            [0.45, "rgba(150,90,230,0.14)"],
            [1, "rgba(0,0,0,0)"],
        ])
    );
    glowTex.colorSpace = THREE.SRGBColorSpace;
    const glowMat = new THREE.MeshBasicMaterial({map: glowTex, transparent: true, depthWrite: false, opacity: 0.5});
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 7.5), glowMat);
    glow.position.z = -1.5;
    scene.add(glow);

    const shadowTex = new THREE.CanvasTexture(
        radialCanvas([
            [0, "rgba(0,0,0,0.55)"],
            [1, "rgba(0,0,0,0)"],
        ])
    );
    const shadowMat = new THREE.MeshBasicMaterial({map: shadowTex, transparent: true, depthWrite: false});
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.45), shadowMat);
    shadow.position.set(0, -HEIGHT / 2 - 0.45, -0.4);
    scene.add(shadow);

    // --- Kích thước: luôn để thẻ vừa khung ---
    const fit = () => {
        const {width, height} = container.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const needH = HEIGHT + 1.5;
        const needW = WIDTH + 1.6;
        camera.position.z = Math.max(needH / (2 * tanHalf), needW / (2 * tanHalf * camera.aspect));
        camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(container);
    fit();

    // --- Con trỏ chuột ---
    const pointer = {x: 0, y: 0, inside: false};
    const setInside = (value) => {
        if (pointer.inside !== value) {
            pointer.inside = value;
            onHoverChange?.(value);
        }
    };
    const onPointerMove = (e) => {
        const r = canvas.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
        pointer.x = THREE.MathUtils.clamp(nx, -1, 1);
        pointer.y = THREE.MathUtils.clamp(ny, -1, 1);
        setInside(Math.abs(nx) <= 1.15 && Math.abs(ny) <= 1.15);
    };
    const onPointerOut = () => setInside(false);
    window.addEventListener("pointermove", onPointerMove, {passive: true});
    document.documentElement.addEventListener("mouseleave", onPointerOut);
    window.addEventListener("blur", onPointerOut);

    // --- Xoay (lật mặt khi click, quay 1 vòng khi đổi NFT) ---
    const clock = new THREE.Clock();
    let spin = 0;
    let spinAnim = null;
    const animateSpin = (delta, duration) => {
        const to = (spinAnim ? spinAnim.to : spin) + delta;
        spinAnim = {from: spin, to, start: clock.elapsedTime, duration};
    };
    const onClick = () => animateSpin(Math.PI, 0.9);
    canvas.addEventListener("click", onClick);

    const tilt = {x: 0, y: 0};
    let hover = 0;
    let pendingSwap = false;

    const frontFacing = () => Math.cos(spin + tilt.y) * Math.cos(tilt.x) > -0.1;
    const swapBuffers = () => {
        active = 1 - active;
        frontMat.uniforms.uMap.value = buffers[active].texture;
        pendingSwap = false;
    };

    // --- Vòng render (tạm dừng khi khuất màn hình / tab ẩn) ---
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
    });
    io.observe(container);

    let frameId;
    const tick = () => {
        frameId = requestAnimationFrame(tick);
        if (!onScreen || document.hidden) {
            clock.getDelta();
            return;
        }
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        const smooth = 1 - Math.exp(-dt * 6);

        hover += ((pointer.inside ? 1 : 0) - hover) * (1 - Math.exp(-dt * 4));
        const idle = reduceMotion ? 0 : 1;
        const targetX = pointer.inside ? -pointer.y * 0.3 : Math.cos(t * 0.5) * 0.05 * idle;
        const targetY = pointer.inside ? pointer.x * 0.4 : Math.sin(t * 0.6) * 0.16 * idle;
        tilt.x += (targetX - tilt.x) * smooth;
        tilt.y += (targetY - tilt.y) * smooth;
        pivot.rotation.set(tilt.x, tilt.y, 0);

        const floatY = Math.sin(t * 1.1) * 0.07 * idle;
        pivot.position.y = floatY;
        shadow.scale.x = 1 - floatY * 1.2;
        shadowMat.opacity = 0.9 - floatY * 2;

        if (spinAnim) {
            const p = Math.min(1, (t - spinAnim.start) / spinAnim.duration);
            spin = spinAnim.from + (spinAnim.to - spinAnim.from) * easeInOutCubic(p);
            if (p >= 1) spinAnim = null;
        }
        card.rotation.y = spin;
        if (pendingSwap && !frontFacing()) swapBuffers();

        const px = pointer.inside ? pointer.x : Math.sin(t * 0.35) * 0.5 * idle;
        const py = pointer.inside ? pointer.y : Math.cos(t * 0.3) * 0.4 * idle;
        for (const m of [frontMat, backMat]) {
            m.uniforms.uTime.value = t;
            m.uniforms.uHover.value = hover;
            m.uniforms.uPointer.value.set(px, py);
        }
        glowMat.opacity = 0.45 + hover * 0.15;
        glow.position.x = tilt.y * 0.4;

        renderer.render(scene, camera);
    };
    tick();

    // --- Cập nhật nội dung thẻ ---
    let disposed = false;
    let loadToken = 0;
    let lastSignature = null;
    let lastData = null;
    let drawnOnce = false;
    const fontsReady = waitForFonts();

    const drawInto = async (data, {quiet}) => {
        const token = ++loadToken;
        const img = await loadCardImage(data.image);
        await fontsReady;
        if (disposed || token !== loadToken) return;
        const target = buffers[1 - active];
        drawCardFront(target.canvas, data, img);
        target.texture.needsUpdate = true;
        if (quiet || !drawnOnce || reduceMotion || !frontFacing()) {
            drawnOnce = true;
            swapBuffers();
        } else {
            pendingSwap = true;
            animateSpin(Math.PI * 2, 1.3);
        }
    };

    fontsReady.then(() => {
        if (disposed) return;
        drawCardBack(backCanvas);
        backTexture.needsUpdate = true;
    });

    return {
        setCard(data) {
            if (!data) return;
            const signature = JSON.stringify([data.key, data.name, data.image, data.status, data.priceValue, data.creator]);
            if (signature === lastSignature) return;
            lastSignature = signature;
            const firstTime = !lastData;
            lastData = data;
            if (firstTime) {
                // vẽ ngay bằng ảnh sinh tự động để thẻ không trống trong lúc tải ảnh
                drawCardFront(buffers[0].canvas, {...data, image: null}, null);
                buffers[0].texture.needsUpdate = true;
            }
            drawInto(data, {quiet: firstTime});
        },
        dispose() {
            disposed = true;
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            io.disconnect();
            window.removeEventListener("pointermove", onPointerMove);
            document.documentElement.removeEventListener("mouseleave", onPointerOut);
            window.removeEventListener("blur", onPointerOut);
            canvas.removeEventListener("click", onClick);
            [faceGeo, edgeGeo, glow.geometry, shadow.geometry].forEach((g) => g.dispose());
            [frontMat, backMat, capMat, edgeMat, glowMat, shadowMat].forEach((m) => m.dispose());
            [...buffers.map((b) => b.texture), backTexture, glowTex, shadowTex].forEach((tx) => tx.dispose());
            renderer.dispose();
        },
    };
}
