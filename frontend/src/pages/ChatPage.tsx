import * as React from 'react';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

export default function ChatPage() {
  const [room, setRoom] = useState('default');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    socket.emit('joinRoom', room);
    socket.on('newMessage', (data) => {
      setMessages((prev) => [...prev, `${data.senderId}: ${data.content}`]);
    });
    return () => {
      socket.off('newMessage');
    };
  }, [room]);

  const handleSend = () => {
    socket.emit('sendMessage', { room, senderId: 'user1', content: message });
    setMessage('');
  };

  return (
    <div>
      <h2>Chat Room: {room}</h2>
      <div>
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
