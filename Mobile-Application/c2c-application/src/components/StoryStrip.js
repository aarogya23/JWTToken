import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, requestMediaAsync, uploadFileAsset } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatTime, getInitials } from '../utils/format';

const normalizeMedia = (story) => {
  const mediaUrl = story?.mediaUrl || '';
  if (mediaUrl.startsWith('http')) return mediaUrl;
  if (mediaUrl.startsWith('data:')) return mediaUrl;
  return mediaUrl ? `data:image/jpeg;base64,${mediaUrl}` : '';
};

export default function StoryStrip() {
  const [stories, setStories] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

  const selectedStory = useMemo(
    () => (selectedIndex == null ? null : stories[selectedIndex]),
    [selectedIndex, stories]
  );

  const loadStories = async () => {
    try {
      const response = await api.get('/api/stories/all');
      setStories(Array.isArray(response.data) ? response.data : []);
    } catch {
      setStories([]);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const uploadStory = async () => {
    try {
      setUploading(true);
      const asset = await requestMediaAsync(['images', 'videos']);
      if (!asset) return;
      const upload = await uploadFileAsset(asset);
      await api.post('/api/stories/upload', {
        mediaUrl: upload?.fileUrl,
        caption: ''
      });
      await loadStories();
    } catch {
      // UI-first native port; backend payload can be adapted later if needed.
    } finally {
      setUploading(false);
    }
  };

  const renderStory = ({ item, index }) => (
    <Pressable style={styles.item} onPress={() => setSelectedIndex(index)}>
      <View style={styles.ring}>
        {normalizeMedia(item) ? (
          <Image source={{ uri: normalizeMedia(item) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={styles.placeholderText}>{getInitials(item.userFullName || 'Story')}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={styles.label}>
        {item.userFullName || 'User'}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        horizontal
        data={[{ id: 'add-story' }, ...stories]}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) =>
          index === 0 ? (
            <Pressable style={styles.item} onPress={uploadStory}>
              <View style={[styles.ring, styles.addRing]}>
                <Ionicons
                  name={uploading ? 'cloud-upload-outline' : 'add'}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.label}>{uploading ? 'Uploading' : 'Add story'}</Text>
            </Pressable>
          ) : (
            renderStory({ item, index: index - 1 })
          )
        }
      />

      <Modal
        visible={!!selectedStory}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedIndex(null)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.close} onPress={() => setSelectedIndex(null)}>
            <Ionicons name="close" size={30} color="#fff" />
          </Pressable>
          {selectedStory ? (
            <View style={styles.viewer}>
              {normalizeMedia(selectedStory) ? (
                <Image source={{ uri: normalizeMedia(selectedStory) }} style={styles.viewerImage} />
              ) : null}
              <View style={styles.viewerMeta}>
                <Text style={styles.viewerName}>{selectedStory.userFullName || 'User'}</Text>
                <Text style={styles.viewerTime}>{formatTime(selectedStory.createdAt)}</Text>
                {selectedStory.caption ? (
                  <Text style={styles.viewerCaption}>{selectedStory.caption}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: -4 },
  list: { gap: 12, paddingVertical: 4 },
  item: { width: 78, alignItems: 'center', gap: 6 },
  ring: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3,
    backgroundColor: '#ffd9bf',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addRing: { backgroundColor: '#fff1e6', borderWidth: 1, borderColor: colors.border },
  avatar: { width: '100%', height: '100%', borderRadius: 30 },
  placeholder: { backgroundColor: '#edd7c2', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontWeight: '800', color: colors.text },
  label: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,16,22,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  close: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  viewer: { width: '100%', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#111' },
  viewerImage: { width: '100%', height: 520, resizeMode: 'cover' },
  viewerMeta: { padding: spacing.md, gap: 6 },
  viewerName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  viewerTime: { color: '#d4d4d4', fontSize: 13 },
  viewerCaption: { color: '#fff', fontSize: 15, lineHeight: 22 }
});
