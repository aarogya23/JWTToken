import { useCallback, useEffect, useRef, useState } from 'react';
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
  const clientRef = useRef(null);
  const bottomRef = useRef(null);

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

    const payload = {
      content: text,
      sender: user?.email || user?.fullName || 'User',
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

  if (!open || groupId == null) return null;

  const ownEmail = user?.email;

  return (
    <div
      className="commune-modal-backdrop"
      style={{ zIndex: 500, alignItems: 'center' }}
      role="presentation"
      onClick={onClose}
    >
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
                    <div className="commune-msg-ts">{formatChatTime(msg.timestamp)}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <div className="commune-chat-foot">
          <input
            className="commune-chat-in"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="button" className="commune-chat-send" onClick={send}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
