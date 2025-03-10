function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef();
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (ref.current.rotation.x += delta));
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}
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
}

export default Box;
