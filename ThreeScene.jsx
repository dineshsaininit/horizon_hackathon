import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ThreeScene() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, 0.015);

    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 30);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.8, 0.5);
    bloomPass.strength = 1.5;
    bloomPass.radius = 0.5;
    bloomPass.threshold = 0.6;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    const keyLight = new THREE.SpotLight(0x00f0ff, 2000, 100, Math.PI / 4, 1.0, 2);
    keyLight.position.set(20, 20, 10);
    scene.add(keyLight);

    const fillLight = new THREE.SpotLight(0x8b5cf6, 1500, 100, Math.PI / 4, 1.0, 2);
    fillLight.position.set(-20, -10, 10);
    scene.add(fillLight);

    const rimLight = new THREE.SpotLight(0xffffff, 3000, 100, Math.PI / 3, 1.0, 2);
    rimLight.position.set(0, 30, -20);
    scene.add(rimLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 0. DNA HELIX (HERO)
    const dnaGroup = new THREE.Group();
    dnaGroup.position.x = 8;
    dnaGroup.scale.set(1.6, 1.6, 1.6);
    masterGroup.add(dnaGroup);

    const numPoints = 150;
    const radius = 3;
    const heightStrand = 40;
    const turns = 3;
    const curvePoints1 = [];
    const curvePoints2 = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * heightStrand;
      curvePoints1.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
      curvePoints2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius));
    }

    const curve1 = new THREE.CatmullRomCurve3(curvePoints1);
    const curve2 = new THREE.CatmullRomCurve3(curvePoints2);
    const tubeGeo1 = new THREE.TubeGeometry(curve1, 300, 0.35, 32, false);
    const tubeGeo2 = new THREE.TubeGeometry(curve2, 300, 0.35, 32, false);

    const strandMat = new THREE.MeshPhysicalMaterial({
      color: 0x050510, emissive: 0x001133, roughness: 0.1, metalness: 0.8,
      clearcoat: 1.0, clearcoatRoughness: 0.15, transmission: 0.3, thickness: 2.0
    });

    dnaGroup.add(new THREE.Mesh(tubeGeo1, strandMat));
    dnaGroup.add(new THREE.Mesh(tubeGeo2, strandMat));

    const rungMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, emissive: 0x00f0ff, emissiveIntensity: 2.5, roughness: 0.2, metalness: 0.9
    });
    const rungGeo = new THREE.CylinderGeometry(0.06, 0.06, radius * 2, 16);

    for (let i = 5; i < numPoints; i += 5) {
      const p1 = curvePoints1[i];
      const p2 = curvePoints2[i];
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const rung = new THREE.Mesh(rungGeo, rungMat);
      rung.position.copy(mid);
      rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(p1, p2).normalize());
      dnaGroup.add(rung);
    }

    // 1. RECORDS GROUP
    const recordsGroup = new THREE.Group();
    recordsGroup.position.x = 8;
    recordsGroup.scale.set(0, 0, 0);
    masterGroup.add(recordsGroup);

    const docMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2, clearcoat: 1 });
    const docGeo = new THREE.BoxGeometry(4, 5, 0.2);
    
    const doc1 = new THREE.Mesh(docGeo, docMat);
    doc1.position.set(0, 0, 0);
    doc1.rotation.z = Math.PI / 12;

    const doc2 = new THREE.Mesh(docGeo, new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, transmission: 0.8, opacity: 0.8, transparent: true }));
    doc2.position.set(1, -0.5, -2);
    doc2.rotation.z = -Math.PI / 10;
    doc2.rotation.y = Math.PI / 6;

    const doc3 = new THREE.Mesh(docGeo, new THREE.MeshPhysicalMaterial({ color: 0x8b5cf6, transmission: 0.8, opacity: 0.8, transparent: true }));
    doc3.position.set(-1, 0.5, -4);
    doc3.rotation.z = Math.PI / 8;
    doc3.rotation.y = -Math.PI / 6;
    
    const crossMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const hBar = new THREE.BoxGeometry(1.5, 0.3, 0.3);
    const vBar = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    const crossGroup = new THREE.Group();
    crossGroup.add(new THREE.Mesh(hBar, crossMat));
    crossGroup.add(new THREE.Mesh(vBar, crossMat));
    crossGroup.position.z = 0.15;
    doc1.add(crossGroup);

    recordsGroup.add(doc1, doc2, doc3);

    // 2. AI DOCTOR
    const aiDoctorGroup = new THREE.Group();
    aiDoctorGroup.position.x = 8;
    aiDoctorGroup.scale.set(0, 0, 0);
    masterGroup.add(aiDoctorGroup);

    // Neural Core (Inner solid)
    const neuralCoreGeo = new THREE.IcosahedronGeometry(1, 2);
    const neuralCoreMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, emissive: 0x00f0ff, emissiveIntensity: 2.0, wireframe: true, transparent: true, opacity: 0.8
    });
    const neuralCore = new THREE.Mesh(neuralCoreGeo, neuralCoreMat);
    aiDoctorGroup.add(neuralCore);

    // Glass Shell
    const shellGeo = new THREE.IcosahedronGeometry(1.8, 3);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6, metalness: 0.9, roughness: 0.05, transmission: 0.95,
      transparent: true, opacity: 0.5, clearcoat: 1.0, ior: 1.6
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    aiDoctorGroup.add(shell);

    // Medical Crosses orbiting
    const buildCross = () => {
      const crossGrp = new THREE.Group();
      const crossMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
      crossGrp.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.1), crossMat));
      crossGrp.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.1), crossMat));
      return crossGrp;
    };

    const cross1 = buildCross();
    cross1.position.set(2.5, 0, 0);
    const cross2 = buildCross();
    cross2.position.set(-2.5, 0, 0);
    const cross3 = buildCross();
    cross3.position.set(0, 2.5, 0);
    const cross4 = buildCross();
    cross4.position.set(0, -2.5, 0);
    
    const crossOrbit = new THREE.Group();
    crossOrbit.add(cross1, cross2, cross3, cross4);
    aiDoctorGroup.add(crossOrbit);

    // Dynamic data rings
    const ringGeo1 = new THREE.TorusGeometry(3, 0.02, 16, 100);
    const orbitRing1 = new THREE.Mesh(ringGeo1, new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.6 }));
    orbitRing1.rotation.x = Math.PI / 2;
    aiDoctorGroup.add(orbitRing1);
    
    const ringGeo2 = new THREE.TorusGeometry(3.5, 0.01, 16, 100);
    const orbitRing2 = new THREE.Mesh(ringGeo2, new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 }));
    orbitRing2.rotation.y = Math.PI / 4;
    aiDoctorGroup.add(orbitRing2);

    // Neural Particles around the core
    const neuronGeo = new THREE.BufferGeometry();
    const neuronCount = 200;
    const neuronPos = [];
    for (let i = 0; i < neuronCount; i++) {
       const theta = Math.random() * Math.PI * 2;
       const phi = Math.acos((Math.random() * 2) - 1);
       const r = 1.0 + Math.random() * 0.7;
       neuronPos.push(
         r * Math.sin(phi) * Math.cos(theta),
         r * Math.sin(phi) * Math.sin(theta),
         r * Math.cos(phi)
       );
    }
    neuronGeo.setAttribute('position', new THREE.Float32BufferAttribute(neuronPos, 3));
    const neuronMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.05, transparent: true, opacity: 0.8 });
    const neurons = new THREE.Points(neuronGeo, neuronMat);
    aiDoctorGroup.add(neurons);

    // 3. OUTBREAK GLOBE
    const globeGroup = new THREE.Group();
    globeGroup.position.x = 8;
    globeGroup.scale.set(0, 0, 0);
    masterGroup.add(globeGroup);

    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
    const earthSpecMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg');
    const earthNormalMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg');
    const earthCloudsMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png');

    const earthGeo = new THREE.SphereGeometry(3, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({ 
      map: earthMap,
      specularMap: earthSpecMap,
      normalMap: earthNormalMap,
      specular: new THREE.Color('grey'),
      shininess: 40
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earth);

    // Subtle atmospheric glow
    const atmosGeo = new THREE.SphereGeometry(3.15, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({ 
      color: 0x0088ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmos = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmos);

    // Clouds layer
    const cloudsGeo = new THREE.SphereGeometry(3.03, 64, 64);
    const cloudsMat = new THREE.MeshPhongMaterial({
      map: earthCloudsMap,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    globeGroup.add(clouds);

    const markerGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    for (let i = 0; i < 20; i++) {
      const marker = new THREE.Mesh(markerGeo, markerMat);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 3.01;
      marker.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      globeGroup.add(marker);
    }

    // 4. FUTURE KNOT
    const futureGroup = new THREE.Group();
    futureGroup.position.x = 8;
    futureGroup.scale.set(0, 0, 0);
    masterGroup.add(futureGroup);

    const knotGeo = new THREE.TorusKnotGeometry(2.5, 0.6, 256, 32);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff, emissive: 0x8b5cf6, emissiveIntensity: 0.8,
      roughness: 0.1, metalness: 1.0, clearcoat: 1.0
    });
    futureGroup.add(new THREE.Mesh(knotGeo, knotMat));

    // Dust particles
    const dustGeo = new THREE.BufferGeometry();
    const dustPoints = [];
    for (let i = 0; i < 150; i++) dustPoints.push((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30 - 15);
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPoints, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.3 }));
    scene.add(dust);

    let scrollY = window.scrollY || 0;
    let targetScrollY = window.scrollY || 0;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    const onScroll = () => { targetScrollY = window.scrollY; };
    const onMouseMove = (event) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouseMove);

    // Give DOM a tick to render elements before ScrollTrigger
    setTimeout(() => {
      const track = document.querySelector('.h-scroll-track');
      const sections = gsap.utils.toArray('.h-panel');

      if (track && sections.length > 0) {
        gsap.to(sections, {
          xPercent: -100 * (sections.length - 1),
          ease: "none",
          scrollTrigger: {
            trigger: ".h-scroll-container",
            pin: true,
            scrub: 1,
            end: () => "+=" + track.offsetWidth,
          }
        });

        ScrollTrigger.create({
          trigger: ".h-scroll-container",
          start: "top center",
          onEnter: () => {
            gsap.to(dnaGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
            gsap.to(recordsGroup.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.5, overwrite: "auto" });
          },
          onLeaveBack: () => {
            gsap.to(dnaGroup.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.5, overwrite: "auto" });
            gsap.to(recordsGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
          }
        });

        ScrollTrigger.create({
          trigger: ".h-scroll-container",
          start: "top top",
          end: () => "+=" + track.offsetWidth,
          scrub: 1,
          onUpdate: (self) => {
            const p = self.progress;
            if (p === 0 && !self.isActive) return;
            if (p < 0.33) {
              gsap.to(recordsGroup.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.5, overwrite: "auto" });
              gsap.to(aiDoctorGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
              gsap.to(globeGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
              gsap.to(futureGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
            } else if (p >= 0.33 && p < 0.66) {
              gsap.to(recordsGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
              gsap.to(aiDoctorGroup.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.5, overwrite: "auto" });
              gsap.to(globeGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
              gsap.to(futureGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
            } else {
              gsap.to(recordsGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
              gsap.to(aiDoctorGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
              gsap.to(globeGroup.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.5, overwrite: "auto" });
              gsap.to(futureGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto" });
            }
          }
        });

        ScrollTrigger.create({
          trigger: ".end-section",
          start: "top center",
          end: "bottom center",
          onEnter: () => {
            gsap.to(globeGroup.scale, { x: 0, y: 0, z: 0, duration: 0.8, overwrite: "auto" });
            gsap.to(futureGroup.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.8, overwrite: "auto" });
          },
          onLeaveBack: () => {
            gsap.to(futureGroup.scale, { x: 0, y: 0, z: 0, duration: 0.8, overwrite: "auto" });
            gsap.to(globeGroup.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.8, overwrite: "auto" });
          }
        });
      }
    }, 100);

    const clock = new THREE.Clock();

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      scrollY += (targetScrollY - scrollY) * 0.05;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      masterGroup.rotation.x = mouseY * 0.05;
      masterGroup.rotation.y = mouseX * 0.1;
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
      camera.position.y += (mouseY * 2 - camera.position.y) * 0.02;

      dnaGroup.rotation.y = elapsedTime * 0.2 + (scrollY * 0.002);
      dnaGroup.position.y = Math.sin(scrollY * 0.005) * 4;

      recordsGroup.rotation.y = elapsedTime * 0.2 + (scrollY * 0.002);
      recordsGroup.position.y = Math.sin(scrollY * 0.005) * 4;

      aiDoctorGroup.rotation.y = elapsedTime * 0.5;
      aiDoctorGroup.position.y = Math.sin(elapsedTime * 2) * 0.5;
      orbitRing1.rotation.y = elapsedTime * 1.5;
      orbitRing2.rotation.x = elapsedTime * 1.1;
      neuralCore.rotation.x = elapsedTime * -0.5;
      neuralCore.rotation.y = elapsedTime * -0.8;
      shell.rotation.x = elapsedTime * 0.2;
      crossOrbit.rotation.z = elapsedTime * 0.5;
      crossOrbit.rotation.x = Math.sin(elapsedTime) * 0.2;
      neurons.rotation.y = elapsedTime * 0.3;

      globeGroup.rotation.y = elapsedTime * 0.3;

      futureGroup.rotation.y = elapsedTime * 0.4;
      futureGroup.rotation.x = elapsedTime * 0.2;

      dust.rotation.y = elapsedTime * 0.02;

      composer.render();
    }

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    // CLEANUP
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      ScrollTrigger.getAll().forEach(t => t.kill());
      renderer.dispose();
      // Dispose materials/geometry in a full prod app...
    };
  }, []);

  return <canvas ref={canvasRef} id="bg-canvas"></canvas>;
}
