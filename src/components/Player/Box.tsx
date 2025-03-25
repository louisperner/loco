import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Import react-live with any type since we don't have type definitions
// @ts-expect-error - R3F component props types not fully defined
import { LiveProvider, LiveComponent } from 'react-live';

interface BoxProps {
  finalCode: string;
  position?: [number, number, number];
  [key: string]: any;
}

const Box: React.FC<BoxProps> = (props) => {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef<THREE.Mesh>(null);
  // Hold state for hovered and clicked events
  const [_hovered, hover] = useState<boolean>(false);
  const [clicked, click] = useState<boolean>(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta;
    }
  });
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(_event) => click(!clicked)}
      onPointerOver={(_event) => hover(true)}
      onPointerOut={(_event) => hover(false)}
    >
      {/* <boxGeometry args={[1, 1, 1]} /> */}
      {/* <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} /> */}
      <Html transform scale={0.5}>
        <div style={{ transform: 'scale(2)' }}>
          <LiveProvider code={props.finalCode} noInline>
            {/* <LivePreview /> */}
            <LiveComponent />
            {/* <LiveError />
                 <LiveEditor /> */}
          </LiveProvider>
        </div>
      </Html>
    </mesh>
  );
};

export default Box; 