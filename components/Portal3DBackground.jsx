import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export default function Portal3DBackground({ type }) {
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

    // DYNAMIC OBJECT BASED ON PORTAL TYPE
    const objGroup = new THREE.Group();
    masterGroup.add(objGroup);

    let tickReferences = {};

    if (type === 'patient') {
      // PATIENT PORTAL: DNA & Records
      objGroup.scale.set(1.5, 1.5, 1.5);
      
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

      objGroup.add(new THREE.Mesh(tubeGeo1, strandMat));
      objGroup.add(new THREE.Mesh(tubeGeo2, strandMat));

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
        objGroup.add(rung);
      }

      // Add floating records
      const docMat = new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, metalness: 0.5, roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.7 });
      const docGeo = new THREE.BoxGeometry(3, 4, 0.1);
      const doc1 = new THREE.Mesh(docGeo, docMat);
      doc1.position.set(5, 0, 2);
      objGroup.add(doc1);
      const doc2 = new THREE.Mesh(docGeo, new THREE.MeshPhysicalMaterial({ color: 0x8b5cf6, metalness: 0.5, roughness: 0.2, transparent: true, opacity: 0.7 }));
      doc2.position.set(-5, -2, -2);
      objGroup.add(doc2);
      
      tickReferences.patientDocs = { doc1, doc2 };

    } else if (type === 'doctor') {
      // DOCTOR PORTAL: Cybernetic AI Core
      objGroup.scale.set(1.5, 1.5, 1.5);

      const neuralCoreGeo = new THREE.IcosahedronGeometry(1.5, 2);
      const neuralCoreMat = new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff, emissive: 0x00f0ff, emissiveIntensity: 2.0, wireframe: true, transparent: true, opacity: 0.8
      });
      const neuralCore = new THREE.Mesh(neuralCoreGeo, neuralCoreMat);
      objGroup.add(neuralCore);

      const shellGeo = new THREE.IcosahedronGeometry(2.5, 3);
      const shellMat = new THREE.MeshPhysicalMaterial({
        color: 0x8b5cf6, metalness: 0.9, roughness: 0.05, transmission: 0.95,
        transparent: true, opacity: 0.5, clearcoat: 1.0, ior: 1.6
      });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      objGroup.add(shell);

      const buildCross = () => {
        const crossGrp = new THREE.Group();
        const crossMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
        crossGrp.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.15), crossMat));
        crossGrp.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.15), crossMat));
        return crossGrp;
      };

      const crossOrbit = new THREE.Group();
      const c1 = buildCross(); c1.position.set(3.5, 0, 0);
      const c2 = buildCross(); c2.position.set(-3.5, 0, 0);
      const c3 = buildCross(); c3.position.set(0, 3.5, 0);
      const c4 = buildCross(); c4.position.set(0, -3.5, 0);
      crossOrbit.add(c1, c2, c3, c4);
      objGroup.add(crossOrbit);

      const ringGeo1 = new THREE.TorusGeometry(4.5, 0.02, 16, 100);
      const orbitRing1 = new THREE.Mesh(ringGeo1, new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.6 }));
      orbitRing1.rotation.x = Math.PI / 2;
      objGroup.add(orbitRing1);
      
      const ringGeo2 = new THREE.TorusGeometry(5, 0.01, 16, 100);
      const orbitRing2 = new THREE.Mesh(ringGeo2, new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 }));
      orbitRing2.rotation.y = Math.PI / 4;
      objGroup.add(orbitRing2);

      tickReferences.doctorCore = { neuralCore, shell, crossOrbit, orbitRing1, orbitRing2 };
    }

    // Dust particles
    const dustGeo = new THREE.BufferGeometry();
    const dustPoints = [];
    for (let i = 0; i < 200; i++) dustPoints.push((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30 - 15);
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPoints, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.3 }));
    scene.add(dust);

    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    const onMouseMove = (event) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse tracking
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      masterGroup.rotation.x = mouseY * 0.2;
      masterGroup.rotation.y = mouseX * 0.2;
      camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
      camera.position.y += (mouseY * 3 - camera.position.y) * 0.02;

      // Type-specific animations
      if (type === 'patient') {
        objGroup.rotation.y = elapsedTime * 0.2;
        objGroup.position.y = Math.sin(elapsedTime) * 1.5;
        if (tickReferences.patientDocs) {
          tickReferences.patientDocs.doc1.rotation.x = elapsedTime * 0.5;
          tickReferences.patientDocs.doc1.position.y = Math.sin(elapsedTime * 1.5) * 2;
          tickReferences.patientDocs.doc2.rotation.y = elapsedTime * 0.4;
          tickReferences.patientDocs.doc2.position.y = Math.cos(elapsedTime * 1.2) * 2 - 2;
        }
      } else if (type === 'doctor') {
        objGroup.rotation.y = elapsedTime * 0.3;
        objGroup.position.y = Math.sin(elapsedTime) * 0.8;
        if (tickReferences.doctorCore) {
          const c = tickReferences.doctorCore;
          c.neuralCore.rotation.x = elapsedTime * -0.5;
          c.neuralCore.rotation.y = elapsedTime * -0.8;
          c.shell.rotation.x = elapsedTime * 0.2;
          c.crossOrbit.rotation.z = elapsedTime * 0.5;
          c.crossOrbit.rotation.x = Math.sin(elapsedTime) * 0.2;
          c.orbitRing1.rotation.y = elapsedTime * 1.5;
          c.orbitRing2.rotation.y = elapsedTime * 1.1;
        }
      }

      dust.rotation.y = elapsedTime * 0.02;

      composer.render();
    }

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      scene.clear();
    };
  }, [type]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
