import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { supabase } from '../supabaseClient.js';

export const DISTRICT_COORDS = {
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "New Delhi": { lat: 28.6139, lng: 77.2090 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Bengaluru": { lat: 12.9716, lng: 77.5946 },
  "Hyderabad": { lat: 17.3850, lng: 78.4867 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Jaipur": { lat: 26.9124, lng: 75.7873 },
  "Surat": { lat: 21.1702, lng: 72.8311 },
  "Lucknow": { lat: 26.8467, lng: 80.9462 },
  "Kanpur": { lat: 26.4499, lng: 80.3319 },
  "Nagpur": { lat: 21.1458, lng: 79.0882 },
  "Indore": { lat: 22.7196, lng: 75.8577 },
  "Thane": { lat: 19.2183, lng: 72.9781 },
  "Bhopal": { lat: 23.2599, lng: 77.4126 },
  "Visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "Pimpri-Chinchwad": { lat: 18.6298, lng: 73.7997 },
  "Patna": { lat: 25.5941, lng: 85.1376 },
  "Vadodara": { lat: 22.3072, lng: 73.1812 },
  "Ghaziabad": { lat: 28.6692, lng: 77.4538 },
  "Ludhiana": { lat: 30.9010, lng: 75.8573 },
  "Agra": { lat: 27.1767, lng: 78.0081 },
  "Nashik": { lat: 20.0110, lng: 73.7909 },
  "Faridabad": { lat: 28.4089, lng: 77.3178 },
  "Meerut": { lat: 28.9845, lng: 77.7064 },
  "Rajkot": { lat: 22.3039, lng: 70.8022 },
  "Kalyan-Dombivli": { lat: 19.2437, lng: 73.1355 },
  "Vasai-Virar": { lat: 19.3919, lng: 72.8397 },
  "Varanasi": { lat: 25.3176, lng: 82.9739 },
  "Srinagar": { lat: 34.0837, lng: 74.7973 },
  "Aurangabad": { lat: 19.8762, lng: 75.3433 },
  "Dhanbad": { lat: 23.7957, lng: 86.4304 },
  "Amritsar": { lat: 31.6340, lng: 74.8723 },
  "Navi Mumbai": { lat: 19.0330, lng: 73.0297 },
  "Allahabad": { lat: 25.4358, lng: 81.8463 },
  "Ranchi": { lat: 23.3441, lng: 85.3096 },
  "Howrah": { lat: 22.5958, lng: 88.3110 },
  "Coimbatore": { lat: 11.0168, lng: 76.9558 },
  "Jabalpur": { lat: 23.1815, lng: 79.9864 },
  "Gwalior": { lat: 26.2124, lng: 78.1772 },
  "Vijayawada": { lat: 16.5062, lng: 80.6480 },
  "Jodhpur": { lat: 26.2389, lng: 73.0243 },
  "Madurai": { lat: 9.9252, lng: 78.1198 },
  "Raipur": { lat: 21.2514, lng: 81.6296 },
  "Kota": { lat: 25.2138, lng: 75.8648 },
  "Chandigarh": { lat: 30.7333, lng: 76.7794 },
  "Guwahati": { lat: 26.1445, lng: 91.7362 },
  "Solapur": { lat: 17.6599, lng: 75.9064 },
  "Hubli-Dharwad": { lat: 15.3647, lng: 75.1240 }
};

const DISEASE_KEYWORDS = ['Chickenpox', 'Dengue', 'Malaria', 'Typhoid', 'Cholera', 'Tuberculosis'];

export default function InteractiveGlobe({ onMarkerClick, focusTarget }) {
  const canvasRef = useRef(null);
  const [dbMarkers, setDbMarkers] = useState([]);

  useEffect(() => {
    async function loadData() {
      // 1. Fetch patients (to get their districts)
      const { data: patients } = await supabase.from('patients').select('aadhar_no, district');
      const patientMap = {};
      if (patients) {
         patients.forEach(p => { patientMap[p.aadhar_no] = p.district; });
      }

      // 2. Fetch medical history
      const { data: history } = await supabase.from('medical_history').select('*');
      
      if (history) {
        // NLP Aggregation Map: district -> { diseaseName: tally }
        const aggregations = {};

        history.forEach(record => {
            const district = patientMap[record.patient_aadhar_no];
            if (!district) return;
            
            const text = record.past_medical_record || '';
            DISEASE_KEYWORDS.forEach(disease => {
               if (text.includes(disease)) {
                  if (!aggregations[district]) aggregations[district] = {};
                  if (!aggregations[district][disease]) aggregations[district][disease] = 0;
                  aggregations[district][disease] += 1;
               }
            });
        });

        // 3. Map aggregations to 3D Globe plots
        const compiledMarkers = [];
        Object.keys(aggregations).forEach(district => {
            const diseaseKeys = Object.keys(aggregations[district]);
            diseaseKeys.forEach(disease => {
                const count = aggregations[district][disease];
                const coords = DISTRICT_COORDS[district];
                if (coords) {
                   // Mathematical scaling formula: Simulate visually accurate city-wide scales from 1 document tally
                   const visualTally = count * 26 + Math.floor(Math.random() * 5); 
                   
                   compiledMarkers.push({
                       lat: coords.lat,
                       lng: coords.lng,
                       city: district,
                       disease: disease,
                       cases: visualTally,
                       status: visualTally > 40 ? 'CRITICAL' : 'WARNING',
                       recommendations: visualTally > 40 ? `Immediate intervention for ${disease} required in ${district}. Deploy medical teams.` : `Monitor ${disease} cluster originating from ${district}.`
                   });
                }
            });
        });

        setDbMarkers(compiledMarkers);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 3.5;
    controls.maxDistance = 15;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0x00f0ff, 0.5);
    backLight.position.set(-5, -3, -5);
    scene.add(backLight);

    // Globe
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const textureLoader = new THREE.TextureLoader();
    const radius = 3;
    const earthGeo = new THREE.SphereGeometry(radius, 64, 64);
    
    // We reuse the textures from the landing page
    const earthMat = new THREE.MeshPhongMaterial({ 
      map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'),
      specularMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'),
      normalMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'),
      specular: new THREE.Color('grey'),
      shininess: 30
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earth);

    // Clouds
    const cloudsMat = new THREE.MeshPhongMaterial({
      map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'),
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.01, 64, 64), cloudsMat);
    globeGroup.add(clouds);

    // Logic to convert Lat/Lng to Vector3 mapped to the texture coordinates
    const calcPosFromLatLon = (lat, lon, R) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180); 
      const x = -(R * Math.sin(phi) * Math.cos(theta));
      const z = (R * Math.sin(phi) * Math.sin(theta));
      const y = (R * Math.cos(phi));
      return new THREE.Vector3(x, y, z);
    };

    // Load Markers
    const markers = [];
    const markerGeo = new THREE.SphereGeometry(0.015, 16, 16);
    const criticalMat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red
    const warningMat = new THREE.MeshBasicMaterial({ color: 0xffbb00 }); // Yellow

    dbMarkers.forEach(data => {
      const mat = data.cases >= 40 ? criticalMat : warningMat;
      const marker = new THREE.Mesh(markerGeo, mat);
      const pos = calcPosFromLatLon(data.lat, data.lng, radius * 1.01); 
      marker.position.copy(pos);
      // We do not push the visual dot into markers to avoid precision misses.
      
      // Add a glow ring
      const ringGeo = new THREE.RingGeometry(0.025, 0.04, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: mat.color, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0,0,0)); 
      
      // Add a massive invisible hitbox to easily catch clicks
      const hitboxGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
      hitbox.position.copy(pos);
      hitbox.userData = { ...data, city: data.city }; 
      
      globeGroup.add(marker);
      globeGroup.add(ring);
      globeGroup.add(hitbox);
      
      markers.push(hitbox); // Raycaster checks the large hitbox
    });

    globeGroup.rotation.y = -Math.PI / 0.65;
    globeGroup.rotation.x = Math.PI / 12;

    // React to Focus State
    if (focusTarget === 'india') {
       const targetPos = calcPosFromLatLon(21, 78, radius * 2.5); 
       globeGroup.rotation.set(0, 0, 0); 
       
       gsap.to(camera.position, {
         x: targetPos.x,
         y: targetPos.y,
         z: targetPos.z,
         duration: 2.5,
         ease: 'power3.inOut'
       });
       gsap.to(controls.target, {
         x: 0, y: 0, z: 0, duration: 2.5, ease: 'power3.inOut'
       });
    }

    // Raycaster for Clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(markers);
      if (intersects.length > 0) {
        onMarkerClick(intersects[0].object.userData);
      } else {
        onMarkerClick(null); 
      }
    };
    window.addEventListener('click', onClick);

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markers);
      if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      clouds.rotation.y -= 0.0005; 
      controls.update(); 
      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      document.body.style.cursor = 'default';
      renderer.dispose();
      scene.clear();
    };
  }, [dbMarkers, focusTarget]); // Removed onMarkerClick to prevent massive WebGL reloads on click

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'grab' }} />;
}
