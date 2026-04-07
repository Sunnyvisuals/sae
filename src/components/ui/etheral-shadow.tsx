'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface EtherealShadowProps {
  color?: string;
  animation?: { scale: number; speed: number };
  noise?: { opacity: number; scale: number };
  revealRadius?: number;
  sizing?: 'fill' | 'contain';
  className?: string;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uNoiseOpacity;
  uniform float uNoiseScale;
  uniform float uAnimationScale;
  uniform float uAnimationSpeed;
  uniform vec2 uMouse;
  uniform float uRevealRadius;
  varying vec2 vUv;

  // Simplex noise function
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 a0 = x - floor(x + 0.5);
    vec3 g = a0.x  * vec2(x0.x,x12.x) + a0.yz * vec2(x0.y,x12.y);
    vec3 l = 1.0 - 17.0 * a0*a0 - 0.85 * h*h;
    vec3 m1 = m * l;
    vec3 m2 = m * m1;
    return 130.0 * dot(m1, g);
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * uAnimationSpeed * 0.01;
    
    // Create ethereal noise
    float n = snoise(uv * uNoiseScale + time);
    n += 0.5 * snoise(uv * uNoiseScale * 2.0 - time * 0.5);
    
    // Calculate distance to mouse for reveal effect
    float dist = distance(uv, uMouse);
    float reveal = 1.0 - smoothstep(0.0, uRevealRadius, dist);
    
    // Combine noise and color
    vec3 color = uColor;
    float alpha = (n * 0.5 + 0.5) * uNoiseOpacity;
    
    // Invert reveal for shadow effect: 1.0 is shadow, 0.0 is reveal
    float shadow = smoothstep(0.0, uRevealRadius, dist);
    
    // Final alpha: shadow opacity modulated by noise
    float finalAlpha = shadow * alpha;
    
    gl_FragColor = vec4(color, finalAlpha);
  }
`;

const ShadowPlane = ({ color, animation, noise, revealRadius }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color || 'rgba(128, 128, 128, 1)') },
    uNoiseOpacity: { value: noise?.opacity ?? 1 },
    uNoiseScale: { value: noise?.scale ?? 1.2 },
    uAnimationScale: { value: animation?.scale ?? 100 },
    uAnimationSpeed: { value: animation?.speed ?? 90 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uRevealRadius: { value: revealRadius ?? 0.3 }
  }), [color, animation, noise, revealRadius]);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.getElapsedTime();
      
      // Smoothly update mouse position
      const targetX = state.mouse.x * 0.5 + 0.5;
      const targetY = state.mouse.y * 0.5 + 0.5;
      material.uniforms.uMouse.value.x += (targetX - material.uniforms.uMouse.value.x) * 0.1;
      material.uniforms.uMouse.value.y += (targetY - material.uniforms.uMouse.value.y) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        transparent
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export const EtherealShadow = ({
  color = "rgba(128, 128, 128, 1)",
  animation = { scale: 100, speed: 90 },
  noise = { opacity: 1, scale: 1.2 },
  revealRadius = 0.3,
  sizing = "fill",
  className = ""
}: EtherealShadowProps) => {
  return (
    <div className={`pointer-events-none fixed inset-0 z-10 ${className}`}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ShadowPlane color={color} animation={animation} noise={noise} revealRadius={revealRadius} />
      </Canvas>
    </div>
  );
};

export default EtherealShadow;
