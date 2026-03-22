/** ChatMessage.fileUrl may be raw base64 or a full data URL */
export function getChatFileDataUrl(msg) {
  if (!msg?.fileUrl) return '';
  const u = msg.fileUrl;
  if (u.startsWith('data:') || u.startsWith('http://') || u.startsWith('https://')) {
    return u;
  }
  const ft = msg.fileType || 'application/octet-stream';
  return `data:${ft};base64,${u}`;
}
