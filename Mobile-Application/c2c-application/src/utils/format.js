export const formatNPR = (value) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export const getInitials = (name) =>
  (name || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
};

export const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const buildWsUrl = (apiUrl, path, token) => {
  const wsBase = apiUrl.replace(/^http/i, 'ws');
  const suffix = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${wsBase}${path}${suffix}`;
};
