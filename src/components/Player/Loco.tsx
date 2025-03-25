import React, { useReducer, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import Spotlight from './Spotlight';
import { Color, Vector3 } from 'three';
import { GLTF } from 'three-stdlib';

// Define types for GLTF result
type GLTFResult = GLTF & {
  nodes: {
    Ball: THREE.Mesh;
    Ball_1: THREE.Mesh;
  };
  materials: {
    'Material.001': THREE.Material;
    'Material.002': THREE.Material;
  };
}

interface LocoProps {
  [key: string]: any;
}

interface MarkerProps {
  children?: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  [key: string]: any;
}

export function Loco(props: LocoProps): React.ReactElement {
  const { nodes, materials } = useGLTF('/loco.glb') as unknown as GLTFResult;
  const ref = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);

  const black = useMemo(() => new Color('#a13585'), []);
  const lime = useMemo(() => new Color('black'), []);
  const [hovered, setHovered] = useState<boolean>(false);

  useFrame(({ mouse, viewport }) => {
    if (ref.current) {
      const x = (mouse.x * viewport.width) / 2.5;
      const y = (mouse.y * viewport.height) / 2.5;
      ref.current.lookAt(x, y, 1);
    }
    if (ref2.current && ref2.current.material) {
      const material = ref2.current.material as THREE.MeshStandardMaterial;
      if (material.color) {
        material.color.lerp(hovered ? lime : black, 0.05);
      }
    }
  });

  return (
    <mesh ref={ref} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <group>
        <mesh
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
function Marker({ children, ...props }: MarkerProps): React.ReactElement {
  const ref = useRef<THREE.Group>(null);
  // This holds the local occluded state
  const [isOccluded, setOccluded] = useState<boolean | undefined>();
  const [isInRange, setInRange] = useState<boolean | undefined>();
  const isVisible = isInRange && !isOccluded;
  // Test distance
  const vec = new THREE.Vector3();
  useFrame((state) => {
    if (ref.current) {
      const range = state.camera.position.distanceTo(ref.current.getWorldPosition(vec)) <= 10;
      if (range !== isInRange) setInRange(range);
    }
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