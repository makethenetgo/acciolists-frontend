import React, { useEffect, useState } from 'react';
import ExpandableTagList from './components/ExpandableTagList';
import {
  Button,
  DataTable,
  Field,
  FlashMessages,
  Modal,
  PageHero,
  Panel,
  TagSelector,
} from './components/ui';
import {
  api,
  buildTagLookup,
  getErrorMessage,
  getRandomTagColor,
  getTagOptions,
  typeLabel,
  typeOptions,
} from './lib/api';

function createScrollForm() {
  return {
    name: '',
    type: 'ip',
    includeTags: [],
    excludeTags: [],
  };
}

function normalizeScrolls(tags, scrolls) {
  const tagLookup = buildTagLookup(tags);

  return scrolls.map(scroll => ({
    ...scroll,
    includeTagNames: scroll.include_tags || [],
    excludeTagNames: scroll.exclude_tags || [],
    includeTagDetails: (scroll.include_tags || []).map(name => tagLookup.get(name) || { name }),
    excludeTagDetails: (scroll.exclude_tags || []).map(name => tagLookup.get(name) || { name }),
  }));
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}

export default function Scrolls() {
  const [tags, setTags] = useState([]);
  const [scrolls, setScrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashItems, setFlashItems] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [createForm, setCreateForm] = useState(createScrollForm());
  const [editScroll, setEditScroll] = useState(null);
  const [editForm, setEditForm] = useState(createScrollForm());

  const tagOptions = getTagOptions(tags);

  const loadScrolls = async () => {
    setLoading(true);

    try {
      const [tagsResponse, scrollsResponse] = await Promise.all([
        api.get('/api/tags'),
        api.get('/api/scrolls'),
      ]);

      const tagsData = tagsResponse.data || [];
      setTags(tagsData);
      setScrolls(normalizeScrolls(tagsData, scrollsResponse.data || []));
      setFlashItems([]);
    } catch (error) {
      setFlashItems([
        {
          id: 'scrolls-load-error',
          type: 'error',
          header: 'Unable to load scrolls',
          content: getErrorMessage(error, 'The control plane could not retrieve scroll data.'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScrolls();
  }, []);

  const createTagOption = async name => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return null;
    }

    const color = getRandomTagColor();

    try {
      const response = await api.post('/api/tags', {
        name: trimmedName,
        color,
      });
      const createdTag = response.data?.name
        ? response.data
        : { name: trimmedName, color };

      setTags(current =>
        [...current.filter(tag => tag.name !== createdTag.name), createdTag].sort((left, right) =>
          left.name.localeCompare(right.name)
        )
      );
      setFlashItems([
        {
          id: `tag-create-${trimmedName}`,
          type: 'success',
          header: 'Tag created',
          content: `Created the "${trimmedName}" tag with a random color.`,
        },
      ]);

      return {
        label: createdTag.name,
        value: createdTag.name,
        color: createdTag.color || color,
      };
    } catch (error) {
      setFlashItems([
        {
          id: `tag-create-error-${trimmedName}`,
          type: 'error',
          header: 'Tag creation failed',
          content: getErrorMessage(error, `The "${trimmedName}" tag could not be created.`),
        },
      ]);

      return null;
    }
  };

  const filteredScrolls = scrolls.filter(scroll => {
    const haystack = [
      scroll.name,
      typeLabel(scroll.type),
      ...scroll.includeTagNames,
      ...scroll.excludeTagNames,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchText.toLowerCase());
  });

  const createScroll = async () => {
    if (!createForm.name.trim() || !createForm.type) {
      setFlashItems([
        {
          id: 'scrolls-create-validation',
          type: 'warning',
          header: 'Scroll name and type are required',
          content: 'Provide a scroll name and choose whether it materializes IP, URL, or domain runes.',
        },
      ]);
      return;
    }

    try {
      await api.post('/api/scrolls', {
        name: createForm.name.trim(),
        type: createForm.type,
        include_tags: createForm.includeTags,
        exclude_tags: createForm.excludeTags,
      });
      setCreateForm(createScrollForm());
      setFlashItems([
        {
          id: 'scrolls-create-success',
          type: 'success',
          header: 'Scroll created',
          content: `Created the "${createForm.name.trim()}" scroll.`,
        },
      ]);
      await loadScrolls();
    } catch (error) {
      setFlashItems([
        {
          id: 'scrolls-create-error',
          type: 'error',
          header: 'Scroll creation failed',
          content: getErrorMessage(error, 'The scroll could not be created.'),
        },
      ]);
    }
  };

  const openEditModal = scroll => {
    setEditScroll(scroll);
    setEditForm({
      name: scroll.name,
      type: scroll.type,
      includeTags: scroll.includeTagNames,
      excludeTags: scroll.excludeTagNames,
    });
  };

  const closeEditModal = () => {
    setEditScroll(null);
    setEditForm(createScrollForm());
  };

  const updateScroll = async () => {
    if (!editScroll || !editForm.type) {
      return;
    }

    try {
      await api.put(`/api/scrolls/${editScroll._id}`, {
        name: editForm.name.trim(),
        type: editForm.type,
        include_tags: editForm.includeTags,
        exclude_tags: editForm.excludeTags,
      });
      setFlashItems([
        {
          id: `scrolls-update-${editScroll._id}`,
          type: 'success',
          header: 'Scroll updated',
          content: `Saved changes to "${editScroll.name}".`,
        },
      ]);
      closeEditModal();
      await loadScrolls();
    } catch (error) {
      setFlashItems([
        {
          id: `scrolls-update-error-${editScroll?._id || 'unknown'}`,
          type: 'error',
          header: 'Scroll update failed',
          content: getErrorMessage(error, `The "${editScroll.name}" scroll could not be updated.`),
        },
      ]);
    }
  };

  const deleteScroll = async scroll => {
    try {
      await api.delete(`/api/scrolls/${scroll._id}`);
      setFlashItems([
        {
          id: `scrolls-delete-${scroll._id}`,
          type: 'success',
          header: 'Scroll deleted',
          content: `Removed "${scroll.name}" from the published set.`,
        },
      ]);
      await loadScrolls();
    } catch (error) {
      setFlashItems([
        {
          id: `scrolls-delete-error-${scroll._id}`,
          type: 'error',
          header: 'Scroll delete failed',
          content: getErrorMessage(error, `The "${scroll.name}" scroll could not be deleted.`),
        },
      ]);
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        actions={
          <Button loading={loading} onClick={loadScrolls} variant="primary">
            Refresh scrolls
          </Button>
        }
        description="Assemble durable published artifacts from tag rules, keep the edge path readable, and maintain the exact include and exclude contract."
        eyebrow="Scroll publication"
      >
        <div className="hero-note-list hero-note-list--stacked">
          <span className="hero-note">Artifact-first publication</span>
          <span className="hero-note">Include and exclude tag control</span>
        </div>
      </PageHero>

      <FlashMessages items={flashItems} />

      <section className="page-grid page-grid--two">
        <Panel
          copy="Each scroll selects a rune inventory, includes the tags you want, then carves out exceptions with explicit excludes."
          kicker="Create scroll"
          title="Define publication rules"
        >
          <div className="form-grid">
            <Field label="Scroll name">
              <input
                className="control-input"
                onChange={event =>
                  setCreateForm(current => ({ ...current, name: event.target.value }))
                }
                placeholder="Enter a scroll name"
                type="text"
                value={createForm.name}
              />
            </Field>

            <Field label="Rune type">
              <div className="segmented-control">
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    aria-pressed={createForm.type === option.value}
                    className={`segmented-control__item${
                      createForm.type === option.value ? ' is-active' : ''
                    }`}
                    onClick={() =>
                      setCreateForm(current => ({ ...current, type: option.value }))
                    }
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field hint="These tags must be present on a rune for it to land in the published file." label="Include tags">
              <TagSelector
                disabledValues={createForm.excludeTags}
                onCreateOption={createTagOption}
                onToggle={value =>
                  setCreateForm(current => ({
                    ...current,
                    includeTags: toggleValue(current.includeTags, value),
                  }))
                }
                options={tagOptions}
                searchPlaceholder="Search include tags or create one"
                selectedValues={createForm.includeTags}
              />
            </Field>

            <Field hint="Use excludes to carve exceptions out of an otherwise eligible source set." label="Exclude tags">
              <TagSelector
                disabledValues={createForm.includeTags}
                onCreateOption={createTagOption}
                onToggle={value =>
                  setCreateForm(current => ({
                    ...current,
                    excludeTags: toggleValue(current.excludeTags, value),
                  }))
                }
                options={tagOptions}
                searchPlaceholder="Search exclude tags or create one"
                selectedValues={createForm.excludeTags}
              />
            </Field>

            <div className="panel-footer">
              <Button onClick={createScroll} variant="primary">
                Create scroll
              </Button>
            </div>
          </div>
        </Panel>

        <Panel
          copy="Published files should keep resolving from the web tier even if the API or database are down."
          kicker="Artifact contract"
          title="How scrolls are served"
        >
          <div className="artifact-box">
            <p className="artifact-box__label">Published path</p>
            <code>/scrolls/&lt;scroll-name&gt;</code>
          </div>

          <Field label="Search current scrolls">
            <input
              className="control-input"
              onChange={event => setSearchText(event.target.value)}
              placeholder="Filter by name, type, or tag"
              type="search"
              value={searchText}
            />
          </Field>

          <div className="artifact-box">
            <p className="artifact-box__label">Visible set</p>
            <code>
              {filteredScrolls.length} of {scrolls.length} scrolls
            </code>
          </div>
        </Panel>
      </section>

      <Panel
        copy="Open the live artifact directly, or adjust the rule set in place and republish through the API."
        kicker="Published set"
        title={`Scrolls (${filteredScrolls.length})`}
      >
        <DataTable
          columns={[
            {
              id: 'name',
              header: 'Scroll',
              render: item => <span className="table-primary">{item.name}</span>,
            },
            {
              id: 'type',
              header: 'Type',
              render: item => <span className="table-mono">{typeLabel(item.type)}</span>,
            },
            {
              id: 'include',
              header: 'Include tags',
              render: item => (
                <ExpandableTagList
                  emptyLabel="No include tags"
                  tags={item.includeTagDetails}
                />
              ),
            },
            {
              id: 'exclude',
              header: 'Exclude tags',
              render: item => (
                <ExpandableTagList
                  emptyLabel="No exclude tags"
                  tags={item.excludeTagDetails}
                />
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              render: item => (
                <div className="table-actions">
                  <Button href={`${window.location.origin}/scrolls/${item.name}`}>
                    View scroll
                  </Button>
                  <Button onClick={() => openEditModal(item)}>Update</Button>
                  <Button onClick={() => deleteScroll(item)} variant="danger">
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          emptyMessage="No scrolls match the current filter."
          loading={loading}
          loadingMessage="Loading scrolls…"
          rowKey={item => item._id}
          rows={filteredScrolls}
        />
      </Panel>

      <Modal
        actions={
          <>
            <Button onClick={closeEditModal}>Cancel</Button>
            <Button onClick={updateScroll} variant="primary">
              Save changes
            </Button>
          </>
        }
        kicker="Update scroll"
        onClose={closeEditModal}
        open={Boolean(editScroll)}
        title={editScroll ? editScroll.name : 'Update scroll'}
      >
        <div className="form-grid">
          <Field label="Scroll name">
            <input
              className="control-input"
              onChange={event =>
                setEditForm(current => ({ ...current, name: event.target.value }))
              }
              type="text"
              value={editForm.name}
            />
          </Field>

          <Field label="Rune type">
            <div className="segmented-control">
              {typeOptions.map(option => (
                <button
                  key={option.value}
                  aria-pressed={editForm.type === option.value}
                  className={`segmented-control__item${
                    editForm.type === option.value ? ' is-active' : ''
                  }`}
                  onClick={() => setEditForm(current => ({ ...current, type: option.value }))}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Include tags">
            <TagSelector
              disabledValues={editForm.excludeTags}
              onCreateOption={createTagOption}
              onToggle={value =>
                setEditForm(current => ({
                  ...current,
                  includeTags: toggleValue(current.includeTags, value),
                }))
              }
              options={tagOptions}
              searchPlaceholder="Search include tags or create one"
              selectedValues={editForm.includeTags}
            />
          </Field>

          <Field label="Exclude tags">
            <TagSelector
              disabledValues={editForm.includeTags}
              onCreateOption={createTagOption}
              onToggle={value =>
                setEditForm(current => ({
                  ...current,
                  excludeTags: toggleValue(current.excludeTags, value),
                }))
              }
              options={tagOptions}
              searchPlaceholder="Search exclude tags or create one"
              selectedValues={editForm.excludeTags}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
