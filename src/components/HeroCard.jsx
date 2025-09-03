import * as THREE from "three";
import {useRef, useEffect, useState} from "react";
import {Raycaster} from "three";

export default function HeroCard() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({width: 0, height: 0});

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
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

        //Initialize object
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
        const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cubeMesh.scale.setScalar(3);
        scene.add(cubeMesh);
        scene.background = new THREE.Color(0x2b2b2b);

        //Raycaster
        const pointer = new THREE.Vector2();
        window.addEventListener("mousedown", (event) => {
            pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        //renderLoop
        const animate = () => {
            window.requestAnimationFrame(animate);
            // cubeMesh.rotation.x += 0.01;
            // cubeMesh.rotation.y += 0.01;
            renderer.render(scene, camera);
        };
        animate();
    }, [dimensions]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <canvas ref={canvasRef} />
        </div>
    );
}
