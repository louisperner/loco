import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';

/**
 * MessageManager - Componente para gerenciar mensagens no ambiente 3D
 * Este é um componente básico que será expandido conforme necessário
 */
function MessageManager() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Função para adicionar uma nova mensagem
    window.addMessage = (text, position) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text,
        position: position || [0, 0, -3],
      }]);
    };

    return () => {
      delete window.addMessage;
    };
  }, []);

  return (
    <>
      {messages.map(message => (
        <group key={message.id} position={message.position}>
          <Html transform>
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '10px',
              maxWidth: '250px',
              backdropFilter: 'blur(5px)',
            }}>
              {message.text}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}

export default MessageManager; 