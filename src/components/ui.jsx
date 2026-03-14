import React, { useEffect, useId, useState } from 'react';

function joinClasses(...values) {
  return values.filter(Boolean).join(' ');
}

export function Button({
  children,
  className,
  disabled = false,
  href,
  loading = false,
  onClick,
  type = 'button',
  variant = 'secondary',
}) {
  const classes = joinClasses('app-button', `app-button--${variant}`, className);

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
    >
      {loading ? 'Working...' : children}
    </button>
  );
}

export function PageHero({ eyebrow, title, description, actions, children }) {
  return (
    <section className="page-hero">
      <div className="page-hero__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h1>{title}</h1> : null}
        {description ? <p className="page-hero__lede">{description}</p> : null}
        {children ? <div className="page-hero__support">{children}</div> : null}
      </div>
      {actions ? <div className="page-hero__actions">{actions}</div> : null}
    </section>
  );
}

export function Panel({ kicker, title, copy, actions, className, children }) {
  return (
    <section className={joinClasses('glass-panel', className)}>
      {(kicker || title || copy || actions) && (
        <header className="glass-panel__header">
          <div>
            {kicker ? <p className="panel-kicker">{kicker}</p> : null}
            {title ? <h2 className="glass-panel__title">{title}</h2> : null}
            {copy ? <p className="glass-panel__copy">{copy}</p> : null}
          </div>
          {actions ? <div className="glass-panel__actions">{actions}</div> : null}
        </header>
      )}
      <div className="glass-panel__body">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      {children}
      {hint ? <span className="form-field__hint">{hint}</span> : null}
    </label>
  );
}

export function FlashMessages({ items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="flash-stack" role="status" aria-live="polite">
      {items.map(item => (
        <article
          key={item.id}
          className={joinClasses('flash-card', `flash-card--${item.type || 'info'}`)}
        >
          {item.header ? <h3>{item.header}</h3> : null}
          <p>{item.content}</p>
        </article>
      ))}
    </div>
  );
}

export function TagSelector({
  options,
  selectedValues,
  disabledValues = [],
  onToggle,
  onCreateOption,
  searchPlaceholder = 'Search tags',
}) {
  const [searchText, setSearchText] = useState('');
  const [creating, setCreating] = useState(false);
  const selectedSet = new Set(selectedValues);
  const disabledSet = new Set(disabledValues);
  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredOptions = normalizedSearch
    ? options.filter(option => {
        const label = (option.label || option.value || '').toLowerCase();
        return label.includes(normalizedSearch);
      })
    : options;
  const exactMatch = normalizedSearch
    ? options.some(option => {
        const label = (option.label || '').toLowerCase();
        const value = (option.value || '').toLowerCase();
        return label === normalizedSearch || value === normalizedSearch;
      })
    : false;
  const canCreate = Boolean(onCreateOption && normalizedSearch && !exactMatch);

  const handleCreate = async () => {
    if (!canCreate || creating) {
      return;
    }

    setCreating(true);

    try {
      const createdOption = await onCreateOption(searchText.trim());

      if (createdOption?.value && !selectedSet.has(createdOption.value)) {
        onToggle(createdOption.value);
      }

      if (createdOption?.value) {
        setSearchText('');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="tag-selector">
      <input
        className="control-input tag-selector__search"
        onChange={event => setSearchText(event.target.value)}
        placeholder={searchPlaceholder}
        type="search"
        value={searchText}
      />

      {canCreate ? (
        <Button
          className="tag-selector__create"
          disabled={creating}
          onClick={handleCreate}
        >
          {creating ? 'Creating tag...' : `Create "${searchText.trim()}"`}
        </Button>
      ) : null}

      {filteredOptions.length ? (
        <div className="choice-chip-grid">
          {filteredOptions.map(option => {
            const selected = selectedSet.has(option.value);
            const disabled = disabledSet.has(option.value) && !selected;

            return (
              <button
                key={option.value}
                aria-pressed={selected}
                className={joinClasses(
                  'choice-chip',
                  selected && 'is-selected',
                  disabled && 'is-disabled'
                )}
                disabled={disabled}
                onClick={() => onToggle(option.value)}
                type="button"
              >
                <span
                  className="choice-chip__swatch"
                  style={{ backgroundColor: option.color || '#7df9c5' }}
                />
                <span className="choice-chip__label">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="empty-inline">
          {options.length
            ? normalizedSearch
              ? canCreate
                ? `No tags match "${searchText.trim()}". Create it above.`
                : 'No tags match this search.'
              : 'No tags available yet.'
            : 'No tags available yet.'}
        </p>
      )}
    </div>
  );
}

export function DataTable({
  columns,
  emptyMessage,
  loading = false,
  loadingMessage = 'Loading…',
  rowKey,
  rows,
}) {
  let body;

  if (loading) {
    body = (
      <tr className="data-table__placeholder">
        <td colSpan={columns.length}>{loadingMessage}</td>
      </tr>
    );
  } else if (!rows.length) {
    body = (
      <tr className="data-table__placeholder">
        <td colSpan={columns.length}>{emptyMessage}</td>
      </tr>
    );
  } else {
    body = rows.map(row => (
      <tr key={rowKey(row)}>
        {columns.map(column => (
          <td key={column.id} className={column.cellClassName}>
            {column.render(row)}
          </td>
        ))}
      </tr>
    ));
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.id} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{body}</tbody>
      </table>
    </div>
  );
}

export function Modal({ actions, children, kicker, onClose, open, title }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.classList.add('acciolists-modal-open');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('acciolists-modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="app-modal">
      <button
        aria-label="Close dialog"
        className="app-modal__backdrop"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="app-modal__card"
        role="dialog"
      >
        <header className="app-modal__header">
          <div>
            {kicker ? <p className="panel-kicker">{kicker}</p> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            aria-label="Close dialog"
            className="app-modal__close"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </header>
        <div className="app-modal__body">{children}</div>
        {actions ? <footer className="app-modal__actions">{actions}</footer> : null}
      </div>
    </div>
  );
}
