export const checkWebGPUSupport = async (): Promise<boolean> => {
  // Check if we're in a secure context (required for WebGPU)
  if (!window.isSecureContext) {
    console.log('WebGPU not supported: Not in secure context (HTTPS required)');
    return false;
  }

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

    // Test actual canvas context creation
    const canvas = document.createElement('canvas');
    // @ts-ignore
    const context = canvas.getContext('webgpu');
    if (!context) {
      console.log('WebGPU not supported: Cannot create WebGPU context');
      device.destroy();
      return false;
    }

    // Clean up test resources
    device.destroy();
    console.log('WebGPU is supported and working!');
    return true;
  } catch (error) {
    console.log('WebGPU not supported:', error);
    return false;
  }
};

export const getCanvasGLConfig = (useWebGPU: boolean) => {
  const baseConfig = {
    powerPreference: 'high-performance' as const,
    preserveDrawingBuffer: true,
    antialias: true,
    failIfMajorPerformanceCaveat: false,
  };

  if (useWebGPU) {
    console.log('Attempting to use WebGPU renderer');
    return {
      ...baseConfig,
      forceWebGL: false,
    };
  } else {
    console.log('Using WebGL renderer (WebGPU not available)');
    return {
      ...baseConfig,
      // Explicitly force WebGL when WebGPU is not supported
      forceWebGL: true,
    };
  }
};