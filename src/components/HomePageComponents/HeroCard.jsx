import * as THREE from "three";
import {useEffect, useRef, useState} from "react";

export default function HeroCard() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({width: 0, height: 0});

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver(([entry]) => {
            const {width, height} = entry.contentRect;
            setDimensions({width: Math.round(width), height: Math.round(height)});
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!dimensions.width || !dimensions.height) return;

        const canvas = canvasRef.current;
        const raycaster = new THREE.Raycaster();
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, dimensions.width / dimensions.height, 0.1, 1000);
        camera.position.z = 5;
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({canvas, antialias: true});
        } catch (err) {
            console.warn("WebGL is not available, skipping 3D hero", err);
            return;
        }
        renderer.setSize(dimensions.width, dimensions.height);
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterials = ["red", "green", "blue", "yellow", "cyan", "purple"].map(
            (color) => new THREE.MeshBasicMaterial({color})
        );
        const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials);
        cubeMesh.scale.setScalar(2);
        cubeMesh.rotation.y = Math.PI;
        scene.add(cubeMesh);
        scene.background = new THREE.Color(0x2b2b2b);

        const pointer = new THREE.Vector2(2, 2); // ngoài canvas cho tới khi rê chuột
        const handleMouseMove = (event) => {
            const rect = canvas.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };
        const handleMouseLeave = () => pointer.set(2, 2);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        const defaultQuaternion = cubeMesh.quaternion.clone();
        const temp = new THREE.Object3D();
        let frameId;

        const animate = () => {
            frameId = window.requestAnimationFrame(animate);
            raycaster.setFromCamera(pointer, camera);
            if (Math.abs(pointer.x) < 0.97 && Math.abs(pointer.y) < 0.97) {
                const target = raycaster.ray.origin.add(raycaster.ray.direction.multiplyScalar(20));
                temp.position.copy(cubeMesh.position);
                temp.lookAt(target);
                cubeMesh.quaternion.slerp(temp.quaternion, 0.1);
            } else {
                cubeMesh.quaternion.slerp(defaultQuaternion, 0.05);
            }
            renderer.render(scene, camera);
        };
        animate();

        // Dọn dẹp khi đổi kích thước / unmount để không chạy nhiều vòng render song song
        return () => {
            window.cancelAnimationFrame(frameId);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            cubeGeometry.dispose();
            cubeMaterials.forEach((m) => m.dispose());
            renderer.dispose();
        };
    }, [dimensions]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-72 rounded-2xl overflow-hidden">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
}
