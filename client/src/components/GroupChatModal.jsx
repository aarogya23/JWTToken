import { useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import api from '../api/axiosConfig';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { apiFetch, getStoredToken } from '../api/client';
import { API_URL } from '../config';
import { getChatFileDataUrl } from '../utils/chatMedia';

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

export default function GroupChatModal({ groupId, groupName, open, onClose, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const clientRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!open || groupId == null) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      return;
    }

    let cancelled = false;
    const loadHistory = async () => {
      try {
        const data = await apiFetch(`/api/chat/history?groupId=${groupId}`);
        if (!cancelled) {
          setMessages(Array.isArray(data) ? data : []);
          setStatus('');
        }
      } catch {
        if (!cancelled) {
          setMessages([]);
          setStatus('Could not load messages. Are you a member of this group?');
        }
      }
    };

    void loadHistory();

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${API_URL}/ws?token=${encodeURIComponent(token)}`),
      reconnectDelay: 5000,
      onConnect: () => {
        setStatus('');
        client.subscribe(`/topic/group/${groupId}`, (message) => {
          try {
            const body = JSON.parse(message.body);
            setMessages((prev) => [...prev, body]);
          } catch {
            /* ignore */
          }
        });
      },
      onDisconnect: () => setStatus('Disconnected — reconnecting…'),
      onStompError: () => setStatus('Chat connection error'),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      cancelled = true;
      client.deactivate();
      clientRef.current = null;
    };
  }, [open, groupId]);

  function send() {
    const text = input.trim();
    const client = clientRef.current;
    if (!text || !client?.connected) {
      return;
    }

    const chatIdentity = user?.email || user?.username || null;
    if (!chatIdentity) {
      setStatus('Missing user identity for chat.');
      return;
    }

    const payload = {
      content: text,
      sender: chatIdentity,
      type: 'CHAT',
      room: groupId,
      timestamp: new Date().toISOString(),
    };

    client.publish({
      destination: `/app/chat.sendMessage/${groupId}`,
      body: JSON.stringify(payload),
    });
    setInput('');
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    const client = clientRef.current;
    const chatIdentity = user?.email || user?.username || null;
    if (!file || !client?.connected || !chatIdentity) {
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { fileUrl, fileName, fileType, fileSize } = response.data;
      client.publish({
        destination: `/app/chat.sendMessage/${groupId}`,
        body: JSON.stringify({
          content: `Shared a file: ${fileName}`,
          sender: chatIdentity,
          type: 'CHAT',
          room: groupId,
          fileUrl,
          fileName,
          fileType,
          fileSize,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      setStatus('Failed to upload attachment.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (!open || groupId == null) return null;

  const ownEmail = user?.email;

  return (
    <div
      className="commune-chat-box"
      role="dialog"
      aria-label="Group chat"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="commune-chat-head">
          <div className="commune-chat-head-av">💬</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="commune-chat-title">{groupName || 'Group chat'}</div>
            <div className="commune-chat-sub">{status}</div>
          </div>
          <button type="button" className="commune-chat-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="commune-chat-msgs">
          {messages.length === 0 ? (
            <div className="commune-chat-empty">
              {status || 'No messages yet. Say hello!'}
            </div>
          ) : (
            messages.map((msg, idx) => {
              const own = msg.sender === ownEmail;
              const displaySender =
                msg.sender && msg.sender.includes('@')
                  ? msg.sender.split('@')[0]
                  : msg.sender;
              const fileSrc = msg.fileUrl ? getChatFileDataUrl(msg) : '';
              const ft = (msg.fileType || '').toLowerCase();

              return (
                <div
                  key={msg.id ?? `${idx}-${msg.timestamp}`}
                  className={`commune-msg-row ${own ? 'own' : 'other'}`}
                >
                  <div
                    className="commune-msg-av"
                    style={{
                      background: own ? 'var(--accent)' : 'var(--surf2)',
                      color: own ? '#fff' : 'var(--text)',
                    }}
                  >
                    {(displaySender || '?').charAt(0).toUpperCase()}
                  </div>
                  <div
                    className="commune-msg-bbl"
                    style={
                      own
                        ? {
                            background: 'linear-gradient(135deg, #e8533a, #f97316)',
                            color: '#fff',
                          }
                        : {}
                    }
                  >
                    {!own ? (
                      <div className="commune-msg-who">{displaySender}</div>
                    ) : null}
                    {msg.content ? <div>{msg.content}</div> : null}
                    {fileSrc && ft.startsWith('image/') ? (
                      <div className="commune-msg-media">
                        <img src={fileSrc} alt="" />
                      </div>
                    ) : null}
                    {fileSrc && ft.startsWith('video/') ? (
                      <div className="commune-msg-media">
                        <video src={fileSrc} controls width={200} />
                      </div>
                    ) : null}
                    {fileSrc && ft.startsWith('audio/') ? (
                      <div className="commune-msg-media">
                        <audio src={fileSrc} controls />
                      </div>
                    ) : null}
                    {fileSrc && !ft.startsWith('image/') && !ft.startsWith('video/') && !ft.startsWith('audio/') ? (
                      <div className="commune-msg-media">
                        <a href={fileSrc} target="_blank" rel="noreferrer" className="cw-file-link">
                          {msg.fileName || 'Open attachment'}
                        </a>
                      </div>
                    ) : null}
                    <div className="commune-msg-ts">{formatChatTime(msg.timestamp)}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <div className="commune-chat-foot">
          <button
            type="button"
            className="cw-icon-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <input
            className="commune-chat-in"
            placeholder={uploading ? 'Uploading receipt...' : 'Type a message…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={uploading}
          />
          <button type="button" className="commune-chat-send" onClick={send}>
            ➤
          </button>
        </div>
    </div>
  );
}
