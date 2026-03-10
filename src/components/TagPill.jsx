import React from 'react';

function normalizeColor(color) {
  if (typeof color !== 'string') {
    return '#1f4b99';
  }

  const trimmed = color.trim();

  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed;
  }

  return '#1f4b99';
}

function getReadableTextColor(hex) {
  const normalized = normalizeColor(hex).replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? '#0f141a' : '#ffffff';
}

export default function TagPill({ tag }) {
  const backgroundColor = normalizeColor(tag?.color);

  return (
    <span
      className="tag-pill"
      style={{
        backgroundColor,
        color: getReadableTextColor(backgroundColor),
      }}
    >
      {tag?.name || 'untagged'}
    </span>
  );
}
