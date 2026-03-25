import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { ArrowLeft, Send, Image as ImageIcon, Paperclip } from 'lucide-react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './Products.css'; // Reuse CSS

const GroupChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [group, setGroup] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    fetchGroupDetails();
    connectWebSocket();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupDetails = async () => {
    try {
      const response = await api.get(`/api/groups/${id}`);
      setGroup(response.data);
    } catch (err) {
      console.error('Failed to get group info', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/api/chat/history?groupId=${id}`);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Failed to fetch chat history', err);
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    // Use SockJS
    const socket = new SockJS(`http://localhost:8080/ws?token=${token}`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      // Subscribe to the topic
      client.subscribe(`/topic/group/${id}`, (message) => {
        if (message.body) {
          const receivedMessage = JSON.parse(message.body);
          setMessages((prevMsg) => [...prevMsg, receivedMessage]);
        }
      });

      // Announce join
      client.publish({
        destination: `/app/chat.addUser/${id}`,
        body: JSON.stringify({ sender: user.username, type: 'JOIN' }),
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.activate();
    setStompClient(client);
  };

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (currentMessage.trim() && stompClient && isConnected) {
      const messageObj = {
        sender: user.username,
        content: currentMessage,
        type: 'CHAT',
        room: parseInt(id)
      };
      
      stompClient.publish({
        destination: `/app/chat.sendMessage/${id}`,
        body: JSON.stringify(messageObj)
      });
      setCurrentMessage('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload file to get URL
      const response = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { fileUrl, fileName, fileType, fileSize } = response.data;

      // 2. Broadcast via STOMP
      if (stompClient && isConnected) {
        const messageObj = {
          sender: user.username,
          content: `Shared a file: ${fileName}`,
          type: 'CHAT',
          room: parseInt(id),
          fileUrl,
          fileName,
          fileType,
          fileSize
        };
        
        stompClient.publish({
          destination: `/app/chat.sendMessage/${id}`,
          body: JSON.stringify(messageObj)
        });
      }
    } catch (err) {
      alert('Failed to upload file. Max size is 15MB.');
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isImage = (fileType) => {
    return fileType && fileType.startsWith('image/');
  };

  return (
    <div className="floating-chat-container">
      <div className="commune-chat-box chat-widget-panel">
        {/* Chat Header */}
        <div className="commune-chat-head" style={{ background: 'var(--grad-warm)', color: '#fff' }}>
          <button 
            className="chat-close-btn" 
            onClick={() => navigate('/groups')} 
            style={{ color: '#fff' }}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="commune-chat-title text-white">
              {group?.name || 'Group Chat'}
            </div>
            <div className="commune-chat-sub" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {isConnected ? 'Online' : 'Disconnected'}
            </div>
          </div>
          <button type="button" className="chat-close-btn" onClick={() => navigate('/groups')} style={{ color: '#fff' }}>
            <X size={24} />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="commune-chat-msgs">
          {messages.length === 0 ? (
            <div className="commune-chat-empty">No messages yet. Say hello!</div>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.sender === user?.username;
              const isSystem = msg.type === 'JOIN' || msg.type === 'LEAVE';

              if (isSystem) {
                return (
                  <div key={index} className="text-center text-xs text-muted my-2 italic">
                    {msg.sender} {msg.type === 'JOIN' ? 'joined' : 'left'} the chat.
                  </div>
                );
              }

              return (
                <div key={index} className={`commune-msg-row ${isMine ? 'own' : 'other'}`}>
                  <div className="commune-msg-av" style={{ background: isMine ? 'var(--accent)' : 'var(--surf2)', color: isMine ? '#fff' : 'var(--text)' }}>
                    {(msg.sender || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="commune-msg-bbl" style={isMine ? { background: 'var(--grad-warm)', color: '#fff' } : {}}>
                    {!isMine && <div className="commune-msg-who">{msg.sender}</div>}
                    
                    {/* Render Image Attachments */}
                    {msg.fileUrl && isImage(msg.fileType) && (
                      <div className="commune-msg-media">
                        <img src={msg.fileUrl} alt="attachment" style={{ maxWidth: '200px', objectFit: 'contain' }} className="rounded" />
                      </div>
                    )}

                    {/* Render Non-Image Attachments */}
                    {msg.fileUrl && !isImage(msg.fileType) && (
                      <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-2 bg-black/10 p-2 rounded mb-2 text-sm hover:underline">
                        <Paperclip size={14} /> {msg.fileName}
                      </a>
                    )}

                    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    <div className="commune-msg-ts">
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="commune-chat-foot">
          <button
            type="button"
            className="p-2 text-muted hover:text-primary transition rounded-full hover:bg-background"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || uploading}
            title="Attach File/Image"
            style={{ flexShrink: 0 }}
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <input
            type="text"
            className="commune-chat-in"
            placeholder={uploading ? "Uploading file..." : "Type a message..."}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={!isConnected || uploading}
          />
          
          <button 
            type="button" 
            className="commune-chat-send"
            onClick={sendMessage}
            disabled={!isConnected || (!currentMessage.trim() && !uploading)}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
