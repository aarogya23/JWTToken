import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import * as Location from 'expo-location';
import { Client } from '@stomp/stompjs';
import { Ionicons } from '@expo/vector-icons';
import { api, getStoredToken } from '../api/client';
import {
  AppButton,
  AppCard,
  AppInput,
  Avatar,
  EmptyState,
  Pill,
  Screen,
  SectionTitle
} from '../components/ui';
import { colors, radius, spacing } from '../theme';
import { buildWsUrl, formatNPR, formatTime } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const response = await api.get('/api/groups/me');
      setGroups(Array.isArray(response.data) ? response.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      setCreating(true);
      const response = await api.post('/api/groups', { name: newGroupName, memberIds: [] });
      setGroups((current) => [...current, response.data]);
      setNewGroupName('');
    } catch {
      Alert.alert('Create failed', 'Could not create group.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen>
      <SectionTitle
        eyebrow="Community"
        title="My groups"
        description="Create group spaces and open chat threads from the native app."
      />
      <AppCard style={{ gap: spacing.md }}>
        <AppInput label="Group name" value={newGroupName} onChangeText={setNewGroupName} placeholder="Tech Enthusiasts" />
        <AppButton title="Create group" onPress={createGroup} loading={creating} icon="add-circle-outline" />
      </AppCard>
      {loading ? (
        <Text style={styles.helperText}>Loading groups...</Text>
      ) : groups.length === 0 ? (
        <EmptyState title="No groups yet" description="Create a new group to start chatting." />
      ) : (
        groups.map((group) => (
          <Pressable key={group.id} onPress={() => navigation.navigate('GroupChat', { id: group.id, name: group.name })}>
            <AppCard style={styles.groupCard}>
              <View style={styles.groupIcon}>
                <Ionicons name="people-outline" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupTitle}>{group.name}</Text>
                <Text style={styles.groupText}>Tap to open chat</Text>
              </View>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
            </AppCard>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

export function GroupChatScreen({ route }) {
  const { user } = useAuth();
  const groupId = route.params?.id;
  const groupName = route.params?.name || 'Group Chat';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Connecting...');
  const clientRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const loadHistory = async () => {
      try {
        const response = await api.get(`/api/chat/history?groupId=${groupId}`);
        if (mounted) {
          setMessages(Array.isArray(response.data) ? response.data : []);
        }
      } catch {
        if (mounted) setMessages([]);
      }
    };

    const connect = async () => {
      const token = await getStoredToken();
      if (!token) {
        setStatus('No auth token found.');
        return;
      }

      const client = new Client({
        webSocketFactory: () => new WebSocket(buildWsUrl(api.defaults.baseURL, '/ws', token)),
        reconnectDelay: 5000
      });

      client.onConnect = () => {
        setStatus('Online');
        client.subscribe(`/topic/group/${groupId}`, (frame) => {
          try {
            const message = JSON.parse(frame.body);
            setMessages((current) => [...current, message]);
          } catch {
            // ignore malformed frame
          }
        });
      };

      client.onStompError = () => setStatus('Connection error');
      client.onWebSocketClose = () => setStatus('Disconnected');
      client.activate();
      clientRef.current = client;
    };

    loadHistory();
    connect();

    return () => {
      mounted = false;
      clientRef.current?.deactivate();
    };
  }, [groupId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
    }
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !clientRef.current?.connected) return;

    clientRef.current.publish({
      destination: `/app/chat.sendMessage/${groupId}`,
      body: JSON.stringify({
        sender: user?.email || user?.username,
        content: text,
        type: 'CHAT',
        room: groupId,
        timestamp: new Date().toISOString()
      })
    });
    setInput('');
  };

  const ownIdentity = user?.email || user?.username;

  return (
    <Screen scroll={false}>
      <View style={styles.chatShell}>
        <View style={styles.chatHeader}>
          <Text style={styles.groupTitle}>{groupName}</Text>
          <Text style={styles.groupText}>{status}</Text>
        </View>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item, index) => String(item.id || `${index}-${item.timestamp}`)}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => {
            const own = item.sender === ownIdentity;
            return (
              <View style={[styles.messageRow, own && styles.messageRowOwn]}>
                {!own ? <Avatar label={item.sender} size={32} /> : null}
                <View style={[styles.bubble, own && styles.bubbleOwn]}>
                  {!own ? <Text style={styles.messageSender}>{item.sender}</Text> : null}
                  <Text style={[styles.messageText, own && styles.messageTextOwn]}>{item.content}</Text>
                  <Text style={[styles.messageTime, own && styles.messageTimeOwn]}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState title="No messages yet" description="Say hello to get the conversation started." />
          }
        />
        <View style={styles.chatComposer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            style={styles.chatInput}
          />
          <Pressable style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

export function DeliveryDashboardScreen() {
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [broadcastingJobId, setBroadcastingJobId] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchRef = useRef(null);
  const socketRef = useRef(null);

  const load = async () => {
    try {
      const [availableRes, activeRes] = await Promise.all([
        api.get('/api/deliveries/available'),
        api.get('/api/deliveries/active')
      ]);
      setAvailableJobs(Array.isArray(availableRes.data) ? availableRes.data : []);
      setActiveJobs(Array.isArray(activeRes.data) ? activeRes.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      watchRef.current?.remove?.();
      socketRef.current?.deactivate();
    };
  }, []);

  const acceptJob = async (orderId) => {
    try {
      await api.post(`/api/deliveries/${orderId}/accept`);
      await load();
      setActiveTab('active');
    } catch (error) {
      Alert.alert('Accept failed', error.response?.data?.message || 'Could not accept job.');
    }
  };

  const markDelivered = async (orderId) => {
    try {
      await api.put(`/api/deliveries/${orderId}/status`, { status: 'DELIVERED' });
      await load();
    } catch (error) {
      Alert.alert('Update failed', error.response?.data?.message || 'Could not mark job delivered.');
    }
  };

  const startBroadcasting = async (orderId) => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Location permission is needed to broadcast delivery GPS.');
      return;
    }

    const token = await getStoredToken();
    const client = new Client({
      webSocketFactory: () => new WebSocket(buildWsUrl(api.defaults.baseURL, '/ws', token)),
      reconnectDelay: 5000
    });

    client.activate();
    socketRef.current = client;
    setBroadcastingJobId(orderId);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 5000,
        distanceInterval: 10
      },
      (location) => {
        const payload = {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        };
        setCurrentCoords(payload);
        if (client.connected) {
          client.publish({
            destination: `/app/delivery/${orderId}/location`,
            body: JSON.stringify(payload)
          });
        }
      }
    );
  };

  const stopBroadcasting = async () => {
    await watchRef.current?.remove?.();
    watchRef.current = null;
    socketRef.current?.deactivate();
    socketRef.current = null;
    setBroadcastingJobId(null);
    setCurrentCoords(null);
  };

  const jobs = activeTab === 'available' ? availableJobs : activeJobs;

  return (
    <Screen>
      <SectionTitle
        eyebrow="Courier dispatch"
        title="Delivery dashboard"
        description="The native courier UI mirrors the web dispatch center, including job acceptance, payout display, and GPS broadcast controls."
      />
      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, activeTab === 'available' && styles.tabActive]} onPress={() => setActiveTab('available')}>
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
            Available ({availableJobs.length})
          </Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'active' && styles.tabActive]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activeJobs.length})
          </Text>
        </Pressable>
      </View>
      {loading ? (
        <Text style={styles.helperText}>Loading the dispatch center...</Text>
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs here yet" description="Check back later for new delivery requests." />
      ) : (
        jobs.map((job) => (
          <AppCard key={job.id} style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.groupTitle}>Delivery #{job.id}</Text>
              <Pill tone={job.status === 'DELIVERED' ? 'success' : 'primary'}>{job.status}</Pill>
            </View>
            <Text style={styles.groupText}>Pick up: {job.sellerLocation || 'Location not provided'}</Text>
            <Text style={styles.groupText}>Drop off: {job.buyerLocation || 'Location not provided'}</Text>
            <Text style={styles.groupText}>Seller: {job.sellerName || 'Unknown seller'}</Text>
            <Text style={styles.groupText}>Buyer: {job.buyerName || 'Unknown buyer'}</Text>
            <Text style={styles.payout}>{formatNPR((job.price || 0) * 0.15)}</Text>
            {broadcastingJobId === job.id && currentCoords ? (
              <View style={styles.coordsPanel}>
                <Text style={styles.coordsText}>
                  GPS: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                </Text>
              </View>
            ) : null}
            {activeTab === 'available' ? (
              <AppButton title="Accept job" onPress={() => acceptJob(job.id)} icon="checkmark-circle-outline" />
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {broadcastingJobId === job.id ? (
                  <AppButton title="Stop GPS" variant="outline" onPress={stopBroadcasting} />
                ) : (
                  <AppButton title="Broadcast GPS" variant="outline" onPress={() => startBroadcasting(job.id)} />
                )}
                <AppButton title="Mark delivered" onPress={() => markDelivered(job.id)} />
              </View>
            )}
          </AppCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  helperText: { color: colors.textMuted, textAlign: 'center', marginTop: 12 },
  groupCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  groupTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  groupText: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  chatShell: { flex: 1, gap: 10, paddingBottom: 20 },
  chatHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  chatList: { padding: spacing.md, gap: 12 },
  messageRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  messageRowOwn: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4
  },
  bubbleOwn: { backgroundColor: colors.primary, borderColor: colors.primary },
  messageSender: { fontSize: 12, fontWeight: '700', color: colors.secondary },
  messageText: { color: colors.text, lineHeight: 21 },
  messageTextOwn: { color: '#fff' },
  messageTime: { color: colors.textMuted, fontSize: 11 },
  messageTimeOwn: { color: '#f7e2da' },
  chatComposer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center'
  },
  chatInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    color: colors.text
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4
  },
  tab: { flex: 1, paddingVertical: 12, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface },
  tabText: { color: colors.textMuted, fontWeight: '700' },
  tabTextActive: { color: colors.text },
  payout: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  coordsPanel: {
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: '#e7f4ff'
  },
  coordsText: { color: colors.secondary, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }
});
