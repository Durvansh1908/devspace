import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ParticleBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Particles
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const particleData: { velocity: THREE.Vector3; numConnections: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      particleData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.006,
          0
        ),
        numConnections: 0,
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x6c63ff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Lines
    const maxConnections = 3;
    const connectionDistance = 2.5;
    const linePositions = new Float32Array(particleCount * particleCount * 3 * 2);
    const lineColors = new Float32Array(particleCount * particleCount * 3 * 2);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      let vertexPos = 0;
      let colorPos = 0;
      let numConnected = 0;

      for (let i = 0; i < particleCount; i++) {
        particleData[i].numConnections = 0;
      }

      for (let i = 0; i < particleCount; i++) {
        const pd = particleData[i];
        positions[i * 3] += pd.velocity.x;
        positions[i * 3 + 1] += pd.velocity.y;

        if (positions[i * 3] > 5 || positions[i * 3] < -5) pd.velocity.x = -pd.velocity.x;
        if (positions[i * 3 + 1] > 5 || positions[i * 3 + 1] < -5) pd.velocity.y = -pd.velocity.y;

        if (pd.numConnections >= maxConnections) continue;

        for (let j = i + 1; j < particleCount; j++) {
          const pd2 = particleData[j];
          if (pd2.numConnections >= maxConnections) continue;

          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            pd.numConnections++;
            pd2.numConnections++;

            const alpha = 1 - dist / connectionDistance;

            linePositions[vertexPos++] = positions[i * 3];
            linePositions[vertexPos++] = positions[i * 3 + 1];
            linePositions[vertexPos++] = positions[i * 3 + 2];

            linePositions[vertexPos++] = positions[j * 3];
            linePositions[vertexPos++] = positions[j * 3 + 1];
            linePositions[vertexPos++] = positions[j * 3 + 2];

            lineColors[colorPos++] = 0.424 * alpha;
            lineColors[colorPos++] = 0.388 * alpha;
            lineColors[colorPos++] = 1.0 * alpha;

            lineColors[colorPos++] = 0.0 * alpha;
            lineColors[colorPos++] = 0.831 * alpha;
            lineColors[colorPos++] = 1.0 * alpha;

            numConnected++;
          }
        }
      }

      lineGeometry.setDrawRange(0, numConnected * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
      particleGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}