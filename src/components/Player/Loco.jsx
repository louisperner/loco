import { useReducer, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import Spotlight from './Spotlight';
import { Color, Vector3 } from 'three';

import React, { useRef, useState } from 'react';

export function Loco(props) {
  const { nodes, materials } = useGLTF('/loco.glb');
  const ref = useRef();
  const ref2 = useRef();

  const black = useMemo(() => new Color('#a13585'), []);
  const lime = useMemo(() => new Color('black'), []);
  const [hovered, setHovered] = useState(false);

  useFrame(({ mouse, viewport }) => {
    const x = (mouse.x * viewport.width) / 2.5;
    const y = (mouse.y * viewport.height) / 2.5;
    ref.current.lookAt(x, y, 1);
    ref2.current.material.color.lerp(hovered ? lime : black, 0.05);
  });

  return (
    <mesh ref={ref} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <group>
        <mesh
          color={lime}
          ref={ref2}
          castShadow
          receiveShadow
          geometry={nodes.Ball.geometry}
          material={materials['Material.001']}
        >
          <Marker rotation={[0, 0, 0]} position={[0, 1.3, 0]}>
            {/* <div className='w-[100px] h-[20px] bg-white text-sm rounded'>PORRA</div> */}
          </Marker>
        </mesh>
        <mesh
          // castShadow
          // receiveShadow
          geometry={nodes.Ball_1.geometry}
          material={materials['Material.002']}
        />
      </group>
    </mesh>
  );
}

export default Loco;

useGLTF.preload('/loco.glb');

// Let's make the marker into a component so that we can abstract some shared logic
function Marker({ children, ...props }) {
  const ref = useRef();
  // This holds the local occluded state
  const [isOccluded, setOccluded] = useState();
  const [isInRange, setInRange] = useState();
  const isVisible = isInRange && !isOccluded;
  // Test distance
  const vec = new THREE.Vector3();
  useFrame((state) => {
    const range = state.camera.position.distanceTo(ref.current.getWorldPosition(vec)) <= 10;
    if (range !== isInRange) setInRange(range);
  });
  return (
    <group ref={ref}>
      <Html
        // 3D-transform contents
        transform
        // Hide contents "behind" other meshes
        occlude
        // Tells us when contents are occluded (or not)
        onOcclude={setOccluded}
        // We just interpolate the visible state into css opacity and transforms
        style={{ transition: 'all 0.2s', opacity: isVisible ? 1 : 0, transform: `scale(${isVisible ? 1 : 0.25})` }}
        {...props}
      >
        {children}
      </Html>
    </group>
  );
}
