/**
 * Story API returns raw base64 in `mediaUrl` and MIME in `mediaType` (see groups.html).
 */
export function getStoryDataUrl(story) {
  if (!story?.mediaUrl) return '';
  const raw = story.mediaUrl;
  if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  const ft = story.mediaType || story.fileType || 'image/jpeg';
  return `data:${ft};base64,${raw}`;
}

export function storyMediaKind(story) {
  const ft = (story?.mediaType || story?.fileType || '').toLowerCase();
  if (ft.startsWith('image/')) return 'image';
  if (ft.startsWith('video/')) return 'video';
  if (ft.startsWith('audio/')) return 'audio';
  return 'unknown';
}
