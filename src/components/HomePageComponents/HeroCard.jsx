import * as THREE from "three";
import {useRef, useEffect, useState} from "react";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {Raycaster} from "three";

export default function HeroCard() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const axisHelper = new THREE.AxesHelper(5);
    const [dimensions, setDimensions] = useState({width: 0, height: 0});
    const materials = [
        new THREE.MeshBasicMaterial({color: "red"}), // right
        new THREE.MeshBasicMaterial({color: "green"}), // left
        new THREE.MeshBasicMaterial({color: "blue"}), // top
        new THREE.MeshBasicMaterial({color: "yellow"}), // bottom
        new THREE.MeshBasicMaterial({color: "cyan"}), // front
        new THREE.MeshBasicMaterial({color: "purple"}), // back
    ];

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                console.log(rect.width, rect.height);
                setDimensions({
                    width: rect.width,
                    height: rect.height,
                });
            }
        };

        updateDimensions();

        window.addEventListener("resize", updateDimensions);

        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    useEffect(() => {
        console.log("dimensions updated:", dimensions);
    }, [dimensions]);

    useEffect(() => {
        if (!dimensions.width || !dimensions.height) return;

        const canvas = canvasRef.current;

        //import methods
        const raycaster = new Raycaster();
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            dimensions.width / dimensions.height,
            0.1,
            1000
        );
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
        renderer.setSize(dimensions.width, dimensions.height);
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        scene.add(axisHelper);
        //Initialize object
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterials = [
            new THREE.MeshBasicMaterial({color: "red"}), // right
            new THREE.MeshBasicMaterial({color: "green"}), // left
            new THREE.MeshBasicMaterial({color: "blue"}), // top
            new THREE.MeshBasicMaterial({color: "yellow"}), // bottom
            new THREE.MeshBasicMaterial({color: "cyan"}), // front
            new THREE.MeshBasicMaterial({color: "purple"}), // back
        ];
        const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials);
        cubeMesh.scale.setScalar(2);
        cubeMesh.rotation.y = Math.PI;
        scene.add(cubeMesh);
        scene.background = new THREE.Color(0x2b2b2b);
        //const controls = new OrbitControls(camera, canvas);
        //Raycaster
        const pointer = new THREE.Vector2();

        const canvasRect = canvas.getBoundingClientRect();

        const handleMouseMove = (event) => {
            // Lấy vị trí của canvas trên màn hình
            const canvasRect = canvas.getBoundingClientRect();

            // Tính tọa độ chuột relative với canvas
            const mouseX = event.clientX - canvasRect.left;
            const mouseY = event.clientY - canvasRect.top;

            // Chuyển đổi sang normalized device coordinates (-1 to 1)
            pointer.x = (mouseX / canvasRect.width) * 2 - 1;
            pointer.y = -(mouseY / canvasRect.height) * 2 + 1;
        };

        canvas.addEventListener("mousemove", handleMouseMove);

        const defaultQuaternion = new THREE.Quaternion();
        defaultQuaternion.copy(cubeMesh.quaternion);

        //renderLoop
        const animate = () => {
            window.requestAnimationFrame(animate);
            // cubeMesh.rotation.x += 0.01;
            // cubeMesh.rotation.y += 0.01;
            renderer.render(scene, camera);
            raycaster.setFromCamera(pointer, camera);
            if (Math.abs(pointer.x) < 0.97 && Math.abs(pointer.y) < 0.97) {
                const target = raycaster.ray.origin.add(
                    raycaster.ray.direction.multiplyScalar(20)
                );
                const temp = new THREE.Object3D();
                temp.position.copy(cubeMesh.position);
                temp.lookAt(target);

                cubeMesh.quaternion.slerp(temp.quaternion, 0.1);
            } else {
                cubeMesh.quaternion.slerp(defaultQuaternion, 0.05);
            }
        };
        animate();
    }, [dimensions]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <canvas ref={canvasRef} />
        </div>
    );
}
