export const elementClickTrackerScript: string = `
// Estilos básicos para visualização
const style = document.createElement('style');
style.textContent = \`
  .loading-circle {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    z-index: 9999;
  }
  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
\`;
document.head.appendChild(style);

// Função global para enviar mensagens para o host
window.sendToHost = function(channel, data) {
  const event = new CustomEvent('boxframe-media-event', {
    detail: data
  });
  // console.log('📤 Enviando evento para o host:', data);
  window.dispatchEvent(event);
};

// Capturar eventos de arrastar imagens
document.addEventListener('dragend', (e) => {
  const target = e.target;
  
  // Verificar se é uma imagem
  if (target.tagName === 'IMG' && target.src) {
    // console.log(JSON.stringify({
      type: 'image',
      src: target.src,
      alt: target.alt || '',
      width: target.offsetWidth || 300,
      height: target.offsetHeight || 200,
      fromUrl: window.location.href
    }));
    
    // Criar objeto com dados da imagem
    const imageData = {
      type: 'image',
      src: target.src,
      alt: target.alt || '',
      width: target.offsetWidth || 300,
      height: target.offsetHeight || 200,
      fromUrl: window.location.href
    };
    
    // Enviar evento
    window.sendToHost('media-event', {
      type: 'dragend',
      data: imageData
    });
  }
});

// Capturar clique direito em imagens
document.addEventListener('contextmenu', (e) => {
  const target = e.target;
  
  if (target.tagName === 'IMG') {
    const imageData = {
      type: 'image',
      src: target.src,
      alt: target.alt || '',
      width: target.offsetWidth || 300,
      height: target.offsetHeight || 200,
      fromUrl: window.location.href
    };
    
    // Enviar evento
    window.sendToHost('media-event', {
      type: 'image-drop',
      data: imageData
    });
    
    // Prevenir o menu de contexto padrão
    e.preventDefault();
  }
});
`; 