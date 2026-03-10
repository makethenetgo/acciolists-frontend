import React, { useState } from 'react';
import TagPill from './TagPill';

export default function ExpandableTagList({
  emptyLabel = 'No tags',
  maxVisible = 4,
  tags,
}) {
  const [expanded, setExpanded] = useState(false);

  if (!tags?.length) {
    return <span className="empty-inline">{emptyLabel}</span>;
  }

  const overflowCount = Math.max(tags.length - maxVisible, 0);
  const visibleTags = expanded ? tags : tags.slice(0, maxVisible);

  return (
    <div className={`expandable-tag-list${expanded ? ' is-expanded' : ''}`}>
      <div className="pill-row">
        {visibleTags.map(tag => (
          <TagPill key={tag.name} tag={tag} />
        ))}
        {overflowCount > 0 ? (
          <button
            aria-expanded={expanded}
            className="tag-pill tag-pill--toggle"
            onClick={() => setExpanded(current => !current)}
            type="button"
          >
            {expanded ? 'Show less' : `+${overflowCount} more`}
          </button>
        ) : null}
      </div>
    </div>
  );
}
