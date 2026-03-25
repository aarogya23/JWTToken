import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, ArrowLeft, Users, Plus, UserPlus, Send, Paperclip } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/axiosConfig';
import { apiFetch, getStoredToken } from '../api/client';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { getChatFileDataUrl } from '../utils/chatMedia';
import './FloatingChatWidget.css';

function formatChatTime(ts) {
  if (ts == null) return '';
  if (Array.isArray(ts)) {
    const [y, mo, d, h, mi, s] = ts;
    const date = new Date(y, mo - 1, d, h, mi, s || 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const date = new Date(ts);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function FloatingChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Views: 'list' | 'chat' | 'createGroup' | 'dm'
  const [viewMode, setViewMode] = useState('list');
  const [activeGroup, setActiveGroup] = useState(null); 
  
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Available users for DM view
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Group Create State
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  // Chat states
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const clientRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch groups
  const fetchGroupsList = useCallback(() => {
    setLoadingGroups(true);
    api.get('/api/groups/me')
      .then(async res => {
          const fetchedGroups = res.data || [];
          const groupsWithLastMessage = await Promise.all(
            fetchedGroups.map(async (g) => {
              try {
                const hist = await apiFetch(`/api/chat/history?groupId=${g.id}`);
                const msgs = Array.isArray(hist) ? hist : [];
                const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                return { ...g, lastMessage: lastMsg };
              } catch (err) {
                return { ...g, lastMessage: null };
              }
            })
          );
          groupsWithLastMessage.sort((a, b) => {
             const tA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
             const tB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
             return tB - tA;
          });
          setGroups(groupsWithLastMessage);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingGroups(false));
  }, []);

  useEffect(() => {
    if (isOpen && viewMode === 'list') {
      fetchGroupsList();
    }
  }, [isOpen, viewMode, fetchGroupsList]);

  // Fetch Users for DM
  useEffect(() => {
    if (isOpen && viewMode === 'dm') {
      setLoadingUsers(true);
      api.get('/api/groups/available-members')
        .then(res => setAvailableUsers(res.data || []))
        .catch(err => console.error(err))
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen, viewMode]);

  // Connect to Active Group Chat
  useEffect(() => {
    if (!isOpen || viewMode !== 'chat' || !activeGroup?.id) return;

    const token = getStoredToken();
    if (!token) return;

    let cancelled = false;
    const loadHistory = async () => {
      try {
        const data = await apiFetch(`/api/chat/history?groupId=${activeGroup.id}`);
        if (!cancelled) {
          setMessages(Array.isArray(data) ? data : []);
          setStatus('');
        }
      } catch {
        if (!cancelled) setStatus('Could not load messages.');
      }
    };
    loadHistory();

    const socket = new SockJS(`${API_URL}/ws?token=${encodeURIComponent(token)}`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      setStatus('');
      client.subscribe(`/topic/group/${activeGroup.id}`, (message) => {
        try {
          const body = JSON.parse(message.body);
          setMessages((prev) => [...prev, body]);
        } catch {}
      });
    };

    client.onStompError = (frame) => {
      setStatus('Connection error');
    };

    client.onWebSocketError = () => {
      setStatus('Connection error');
    };

    client.onWebSocketClose = () => {
      setStatus('Disconnected...');
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
      clientRef.current = null;
    };
  }, [isOpen, viewMode, activeGroup]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, []);

  useEffect(() => {
    if (viewMode === 'chat') scrollToBottom();
  }, [messages, viewMode, scrollToBottom]);

  // Handlers
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const response = await api.post('/api/groups', { name: newGroupName, memberIds: [] });
      setNewGroupName('');
      setActiveGroup(response.data);
      setViewMode('chat');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleStartDM = async (otherUser) => {
    setCreating(true);
    try {
      const dmName = `DM: ${user.fullName || user.username} & ${otherUser.fullName || otherUser.username}`;
      const response = await api.post('/api/groups', { name: dmName, memberIds: [otherUser.id] });
      setActiveGroup(response.data);
      setViewMode('chat');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start direct message');
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = () => {
    const text = input.trim();
    const client = clientRef.current;
    if (!text || !client?.connected || !activeGroup) return;

    const payload = {
      content: text,
      sender: user?.email || user?.fullName || user?.username || 'User',
      type: 'CHAT',
      room: activeGroup.id,
      timestamp: new Date().toISOString(),
    };

    if (client.connected) {
      client.publish({
        destination: `/app/chat.sendMessage/${activeGroup.id}`,
        body: JSON.stringify(payload)
      });
      setInput('');
    } else {
      setStatus('Not connected... Try again.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeGroup) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { fileUrl, fileName, fileType, fileSize } = response.data;

      const client = clientRef.current;
      if (client?.connected) {
        const payload = {
          content: `Shared a file: ${fileName}`,
          sender: user?.email || user?.fullName || user?.username || 'User',
          type: 'CHAT',
          room: activeGroup.id,
          fileUrl, fileName, fileType, fileSize,
          timestamp: new Date().toISOString(),
        };
        client.publish({
          destination: `/app/chat.sendMessage/${activeGroup.id}`,
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
  };

  const goBackToList = () => {
    setActiveGroup(null);
    setViewMode('list');
  };

  const ownEmail = user?.email || user?.username;

  return (
    <div className="floating-chat-container">
      {/* FAB Button */}
      {!isOpen && (
        <button className="floating-chat-fab" onClick={() => setIsOpen(true)} title="Chat Groups">
          <MessageCircle size={30} />
        </button>
      )}

      {/* Main Widget Panel */}
      {isOpen && (
        <div className="cw-panel">
          
          {/* Header */}
          <div className="cw-header">
            {viewMode !== 'list' ? (
              <button className="cw-header-btn" onClick={goBackToList}>
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="cw-header-icon">
                <MessageCircle size={18} />
              </div>
            )}
            
            <div className="cw-header-info">
              <div className="cw-header-title">
                {viewMode === 'chat' && activeGroup ? activeGroup.name : 
                 viewMode === 'createGroup' ? 'New Group' : 
                 viewMode === 'dm' ? 'New Message' : 'Messages'}
              </div>
              <div className="cw-header-sub">
                {viewMode === 'chat' ? (status || 'Online') : 'Your Conversations'}
              </div>
            </div>
            
            <button className="cw-header-btn" onClick={closeWidget}>
              <X size={22} />
            </button>
          </div>

          {/* VIEW CONTROLLER */}
          <div className="cw-body">
            
            {/* --- LIST VIEW --- */}
            {viewMode === 'list' && (
              <div className="cw-scrollable">
                {/* Actions Row */}
                <div className="cw-actions-row">
                  <button className="cw-action-btn" onClick={() => setViewMode('dm')}>
                    <UserPlus size={14} /> Direct Msg
                  </button>
                  <button className="cw-action-btn" onClick={() => setViewMode('createGroup')}>
                    <Plus size={14} /> New Group
                  </button>
                </div>

                <div className="cw-section-title">Recent Conversations</div>

                <div style={{ flex: 1 }}>
                  {loadingGroups ? (
                    <div className="cw-empty-state">Loading conversations...</div>
                  ) : groups.length === 0 ? (
                    <div className="cw-empty-state">
                      <MessageCircle size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                      <p style={{ margin: 0 }}>No conversations yet.</p>
                      <button className="cw-empty-link" onClick={() => setViewMode('dm')}>Start a message</button>
                    </div>
                  ) : (
                    groups.map(g => {
                      const senderName = g.lastMessage?.sender?.includes('@') ? g.lastMessage.sender.split('@')[0] : g.lastMessage?.sender;
                      return (
                        <div key={g.id} className="cw-list-item" onClick={() => { setActiveGroup(g); setViewMode('chat'); }}>
                          <div className="cw-avatar cw-avatar-group">
                            <Users size={20} />
                          </div>
                          <div className="cw-item-info">
                            <h4 className="cw-item-title">{g.name}</h4>
                            {g.lastMessage ? (
                              <p className="cw-item-sub">
                                <span style={{ fontWeight: 600, opacity: 0.8 }}>{senderName}:</span> {g.lastMessage.content || 'Sent an attachment'}
                              </p>
                            ) : (
                              <p className="cw-item-sub" style={{ fontStyle: 'italic' }}>No messages yet</p>
                            )}
                          </div>
                          {g.lastMessage && (
                            <div className="cw-item-ts">
                              {formatChatTime(g.lastMessage.timestamp)}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* --- DIRECT MESSAGE VIEW --- */}
            {viewMode === 'dm' && (
              <div className="cw-scrollable">
                <div className="cw-section-title">Select User to Message</div>
                {loadingUsers ? (
                  <div className="cw-empty-state">Finding users...</div>
                ) : availableUsers.length === 0 ? (
                  <div className="cw-empty-state">No users available.</div>
                ) : (
                  <div>
                    {availableUsers.map(u => (
                      <div key={u.id} className="cw-list-item" onClick={() => handleStartDM(u)}>
                        <div className="cw-avatar cw-avatar-user">
                          {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="cw-item-info">
                          <div className="cw-item-title">{u.fullName || 'User'}</div>
                          <div className="cw-item-sub">{u.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- CREATE GROUP VIEW --- */}
            {viewMode === 'createGroup' && (
              <div className="cw-scrollable">
                <form onSubmit={handleCreateGroup} className="cw-form">
                  <p style={{ fontSize: '12px', color: 'var(--cw-text-muted)', margin: '0 0 8px 0' }}>
                    Create a new group to chat with multiple people.
                  </p>
                  <div>
                    <label className="cw-label">Group Name</label>
                    <input 
                      type="text" 
                      className="cw-input"
                      placeholder="e.g. Trading Club"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button type="submit" disabled={creating || !newGroupName.trim()} className="cw-btn-primary">
                    {creating ? 'Creating...' : 'Create Group'}
                  </button>
                </form>
              </div>
            )}

            {/* --- CHAT VIEW --- */}
            {viewMode === 'chat' && activeGroup && (
              <>
                <div className="cw-chat-area">
                  {messages.length === 0 ? (
                    <div className="cw-empty-state">{status || 'No messages yet.'}</div>
                  ) : (
                    messages.map((msg, idx) => {
                      const own = (msg.sender === ownEmail) || (msg.sender === user?.fullName);
                      const displaySender = msg.sender && msg.sender.includes('@') ? msg.sender.split('@')[0] : msg.sender;
                      const fileSrc = msg.fileUrl ? getChatFileDataUrl(msg) : '';
                      const ft = (msg.fileType || '').toLowerCase();

                      return (
                        <div key={msg.id ?? `${idx}-${msg.timestamp}`} className={`cw-msg-row ${own ? 'own' : 'other'}`}>
                          {!own && (
                            <div className="cw-msg-av">
                              {(displaySender || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="cw-msg-bubble">
                            {!own && <div className="cw-msg-who">{displaySender}</div>}
                            {msg.content && <div className="cw-msg-content">{msg.content}</div>}
                            {fileSrc && ft.startsWith('image/') && (
                              <div className="cw-msg-media">
                                <img src={fileSrc} alt="" />
                              </div>
                            )}
                            <div className="cw-msg-ts">
                              {formatChatTime(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} style={{ height: '1px' }} />
                </div>
                
                {/* Chat Input */}
                <div className="cw-input-area">
                  <button className="cw-icon-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Paperclip size={18} />
                  </button>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt" />
                  
                  <input
                    className="cw-chat-input"
                    placeholder={uploading ? "Uploading..." : "Message..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={uploading}
                  />
                  
                  <button className={`cw-send-btn ${input.trim() ? 'active' : ''}`} onClick={sendMessage} disabled={!input.trim() || uploading}>
                    <Send size={16} style={input.trim() ? { marginLeft: '2px' } : {}} />
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
