import axios from 'axios';

export const apiUrl = import.meta.env.VITE_API_URL || '';
let accessTokenResolver = async () => null;

export const api = axios.create({
  baseURL: apiUrl,
});

api.interceptors.request.use(async config => {
  const nextConfig = { ...config };

  if (!nextConfig.headers?.Authorization) {
    const accessToken = await accessTokenResolver();
    if (accessToken) {
      nextConfig.headers = {
        ...(nextConfig.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      };
    }
  }

  return nextConfig;
});

export function setAccessTokenResolver(resolver) {
  accessTokenResolver = resolver || (async () => null);
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function getErrorMessage(error, fallbackMessage) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string' && detail.message.trim()) {
      return detail.message;
    }

    try {
      return JSON.stringify(detail);
    } catch {
      return fallbackMessage;
    }
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export function formatDateForDisplay(value) {
  if (!value) {
    return 'Never';
  }

  const normalized = value.length > 10 ? value.slice(0, 10) : value;
  const parsed = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return dateFormatter.format(parsed);
}

export function normalizeDateInput(value) {
  if (!value) {
    return '';
  }

  return value.length > 10 ? value.slice(0, 10) : value;
}

export function typeLabel(type) {
  return (
    {
      ip: 'IP',
      url: 'URL',
      domain: 'Domain',
    }[type] || type
  );
}

export const typeOptions = [
  { label: 'IP', value: 'ip' },
  { label: 'URL', value: 'url' },
  { label: 'Domain', value: 'domain' },
];

export function getTagOptions(tags) {
  return tags.map(tag => ({
    label: tag.name,
    value: tag.name,
    color: tag.color || '#7df9c5',
  }));
}

export function selectTagOptions(tags, names = []) {
  const nameSet = new Set(names);
  return getTagOptions(tags).filter(option => nameSet.has(option.value));
}

export function buildTagLookup(tags) {
  return new Map(tags.map(tag => [tag.name, tag]));
}
