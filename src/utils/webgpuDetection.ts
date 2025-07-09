export const checkWebGPUSupport = async (): Promise<boolean> => {
  // @ts-ignore
  if (!navigator.gpu) {
    console.log('WebGPU not supported: navigator.gpu not available');
    return false;
  }

  try {
    // @ts-ignore
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.log('WebGPU not supported: No adapter found');
      return false;
    }

    const device = await adapter.requestDevice();
    if (!device) {
      console.log('WebGPU not supported: No device found');
      return false;
    }

    console.log('WebGPU is supported!');
    return true;
  } catch (error) {
    console.log('WebGPU not supported:', error);
    return false;
  }
};

export const getCanvasGLConfig = (useWebGPU: boolean) => {
  if (useWebGPU) {
    // console.log('Using WebGPU renderer');
    return {
      powerPreference: 'high-performance' as const,
      preserveDrawingBuffer: true,
      antialias: true,
      failIfMajorPerformanceCaveat: false,
      forceWebGL: false,
    };
  } else {
    // console.log('Using WebGL renderer');
    return {
      powerPreference: 'high-performance' as const,
      preserveDrawingBuffer: true,
      antialias: true,
      failIfMajorPerformanceCaveat: false,
    };
  }
};