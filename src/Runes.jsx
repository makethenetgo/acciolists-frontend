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
  formatDateForDisplay,
  getErrorMessage,
  getTagOptions,
  normalizeDateInput,
  typeLabel,
  typeOptions,
} from './lib/api';

function createRuneForm() {
  return {
    name: '',
    tags: [],
    type: 'ip',
    expires: false,
    expirationDate: '',
  };
}

function normalizeRunes(tags, responses) {
  const tagLookup = buildTagLookup(tags);

  return responses.flatMap(({ type, data }) =>
    data.map(rune => ({
      ...rune,
      type,
      tagNames: rune.tags || [],
      tagDetails: (rune.tags || []).map(name => tagLookup.get(name) || { name }),
    }))
  );
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}

export default function Runes() {
  const [tags, setTags] = useState([]);
  const [runes, setRunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashItems, setFlashItems] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilters, setTypeFilters] = useState({
    ip: true,
    url: true,
    domain: true,
  });
  const [createForm, setCreateForm] = useState(createRuneForm());
  const [editRune, setEditRune] = useState(null);
  const [editForm, setEditForm] = useState(createRuneForm());

  const tagOptions = getTagOptions(tags);

  const loadRunes = async () => {
    setLoading(true);

    try {
      const [tagsResponse, ipResponse, urlResponse, domainResponse] = await Promise.all([
        api.get('/api/tags'),
        api.get('/api/runes/ip'),
        api.get('/api/runes/url'),
        api.get('/api/runes/domain'),
      ]);

      const tagsData = tagsResponse.data || [];
      setTags(tagsData);
      setRunes(
        normalizeRunes(tagsData, [
          { type: 'ip', data: ipResponse.data || [] },
          { type: 'url', data: urlResponse.data || [] },
          { type: 'domain', data: domainResponse.data || [] },
        ])
      );
      setFlashItems([]);
    } catch (error) {
      setFlashItems([
        {
          id: 'runes-load-error',
          type: 'error',
          header: 'Unable to load runes',
          content: getErrorMessage(error, 'The control plane could not retrieve rune data.'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRunes();
  }, []);

  const filteredRunes = runes.filter(rune => {
    if (!typeFilters[rune.type]) {
      return false;
    }

    const haystack = [
      rune.name,
      typeLabel(rune.type),
      ...(rune.tagNames || []),
      rune.expires ? formatDateForDisplay(rune.expiration_date) : 'Never',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchText.toLowerCase());
  });

  const createRune = async () => {
    if (!createForm.name.trim() || !createForm.type) {
      setFlashItems([
        {
          id: 'runes-create-validation',
          type: 'warning',
          header: 'Rune name and type are required',
          content: 'Provide a rune value and choose whether it is an IP, URL, or domain.',
        },
      ]);
      return;
    }

    if (createForm.expires && !createForm.expirationDate) {
      setFlashItems([
        {
          id: 'runes-expiration-validation',
          type: 'warning',
          header: 'Expiration date required',
          content: 'Enable expiration only when an expiration date is provided.',
        },
      ]);
      return;
    }

    try {
      await api.post(`/api/runes/${createForm.type}`, {
        name: createForm.name.trim(),
        tags: createForm.tags,
        expires: createForm.expires,
        expiration_date: createForm.expires ? createForm.expirationDate : null,
      });
      setCreateForm(createRuneForm());
      setFlashItems([
        {
          id: 'runes-create-success',
          type: 'success',
          header: 'Rune created',
          content: `Added "${createForm.name.trim()}" to the ${typeLabel(createForm.type)} inventory.`,
        },
      ]);
      await loadRunes();
    } catch (error) {
      setFlashItems([
        {
          id: 'runes-create-error',
          type: 'error',
          header: 'Rune creation failed',
          content: getErrorMessage(error, 'The rune could not be created.'),
        },
      ]);
    }
  };

  const openEditModal = rune => {
    setEditRune(rune);
    setEditForm({
      name: rune.name,
      tags: rune.tagNames || [],
      type: rune.type,
      expires: Boolean(rune.expires),
      expirationDate: normalizeDateInput(rune.expiration_date),
    });
  };

  const closeEditModal = () => {
    setEditRune(null);
    setEditForm(createRuneForm());
  };

  const updateRune = async () => {
    if (!editRune) {
      return;
    }

    if (editForm.expires && !editForm.expirationDate) {
      setFlashItems([
        {
          id: 'runes-update-validation',
          type: 'warning',
          header: 'Expiration date required',
          content: `Add an expiration date before saving changes to "${editRune.name}".`,
        },
      ]);
      return;
    }

    try {
      await api.put(`/api/runes/${editRune.type}/${editRune._id}`, {
        tags: editForm.tags,
        expires: editForm.expires,
        expiration_date: editForm.expires ? editForm.expirationDate : null,
      });
      setFlashItems([
        {
          id: `runes-update-${editRune._id}`,
          type: 'success',
          header: 'Rune updated',
          content: `Saved changes to "${editRune.name}".`,
        },
      ]);
      closeEditModal();
      await loadRunes();
    } catch (error) {
      setFlashItems([
        {
          id: `runes-update-error-${editRune._id}`,
          type: 'error',
          header: 'Rune update failed',
          content: getErrorMessage(error, `The "${editRune.name}" rune could not be updated.`),
        },
      ]);
    }
  };

  const deleteRune = async rune => {
    try {
      await api.delete(`/api/runes/${rune.type}/${rune._id}`);
      setFlashItems([
        {
          id: `runes-delete-${rune._id}`,
          type: 'success',
          header: 'Rune deleted',
          content: `Removed "${rune.name}" from the inventory.`,
        },
      ]);
      await loadRunes();
    } catch (error) {
      setFlashItems([
        {
          id: `runes-delete-error-${rune._id}`,
          type: 'error',
          header: 'Rune delete failed',
          content: getErrorMessage(error, `The "${rune.name}" rune could not be deleted.`),
        },
      ]);
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        actions={
          <Button loading={loading} onClick={loadRunes} variant="primary">
            Refresh inventory
          </Button>
        }
        description="Create, filter, and maintain the IPs, URLs, and domains that feed every generated scroll."
        eyebrow="Rune inventory"
        title="Keep the source set clean before you publish from it."
      >
        <div className="hero-note-list">
          <span className="hero-note">Tag-driven selection</span>
          <span className="hero-note">Expiration-aware maintenance</span>
        </div>
      </PageHero>

      <FlashMessages items={flashItems} />

      <section className="page-grid page-grid--two">
        <Panel
          copy="Create a new rune and attach the tags that should make it eligible for later scroll generation."
          kicker="Create rune"
          title="Add inventory"
        >
          <div className="form-grid">
            <Field label="Rune value">
              <input
                className="control-input"
                onChange={event =>
                  setCreateForm(current => ({ ...current, name: event.target.value }))
                }
                placeholder="Enter an IP, URL, or domain"
                type="text"
                value={createForm.name}
              />
            </Field>

            <Field label="Type">
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

            <Field hint="Select every tag that should make this rune discoverable." label="Tags">
              <TagSelector
                onToggle={value =>
                  setCreateForm(current => ({
                    ...current,
                    tags: toggleValue(current.tags, value),
                  }))
                }
                options={tagOptions}
                selectedValues={createForm.tags}
              />
            </Field>

            <label className="checkbox-row">
              <input
                checked={createForm.expires}
                onChange={event =>
                  setCreateForm(current => ({
                    ...current,
                    expires: event.target.checked,
                    expirationDate: event.target.checked ? current.expirationDate : '',
                  }))
                }
                type="checkbox"
              />
              <span>Rune expires</span>
            </label>

            {createForm.expires ? (
              <Field label="Expiration date">
                <input
                  className="control-input"
                  onChange={event =>
                    setCreateForm(current => ({
                      ...current,
                      expirationDate: event.target.value,
                    }))
                  }
                  type="date"
                  value={createForm.expirationDate}
                />
              </Field>
            ) : null}

            <div className="panel-footer">
              <Button onClick={createRune} variant="primary">
                Create rune
              </Button>
            </div>
          </div>
        </Panel>

        <Panel
          copy="Use search and type filters together to keep edits tight when the inventory grows."
          kicker="Filter inventory"
          title="Cut through the noise"
        >
          <div className="form-grid">
            <Field label="Search">
              <input
                className="control-input"
                onChange={event => setSearchText(event.target.value)}
                placeholder="Filter by value, tag, type, or expiration"
                type="search"
                value={searchText}
              />
            </Field>

            <Field label="Rune types">
              <div className="segmented-control">
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    aria-pressed={typeFilters[option.value]}
                    className={`segmented-control__item${
                      typeFilters[option.value] ? ' is-active' : ''
                    }`}
                    onClick={() =>
                      setTypeFilters(current => ({
                        ...current,
                        [option.value]: !current[option.value],
                      }))
                    }
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="artifact-box">
              <p className="artifact-box__label">Showing</p>
              <code>
                {filteredRunes.length} of {runes.length} runes
              </code>
            </div>
          </div>
        </Panel>
      </section>

      <Panel
        copy="Direct edits happen inline through the API. Use tags to shape eligibility and expiration to phase out stale entries."
        kicker="Inventory table"
        title={`Runes (${filteredRunes.length})`}
      >
        <DataTable
          columns={[
            {
              id: 'name',
              header: 'Rune',
              render: item => <span className="table-primary">{item.name}</span>,
            },
            {
              id: 'type',
              header: 'Type',
              render: item => <span className="table-mono">{typeLabel(item.type)}</span>,
            },
            {
              id: 'tags',
              header: 'Tags',
              render: item => (
                <ExpandableTagList emptyLabel="No tags" tags={item.tagDetails} />
              ),
            },
            {
              id: 'expiration',
              header: 'Expiration',
              render: item => (
                <span className="table-mono">
                  {item.expires ? formatDateForDisplay(item.expiration_date) : 'Never'}
                </span>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              render: item => (
                <div className="table-actions">
                  <Button onClick={() => openEditModal(item)}>Update</Button>
                  <Button onClick={() => deleteRune(item)} variant="danger">
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          emptyMessage="No runes match the current filters."
          loading={loading}
          loadingMessage="Loading runes…"
          rowKey={item => item._id}
          rows={filteredRunes}
        />
      </Panel>

      <Modal
        actions={
          <>
            <Button onClick={closeEditModal}>Cancel</Button>
            <Button onClick={updateRune} variant="primary">
              Save changes
            </Button>
          </>
        }
        kicker="Update rune"
        onClose={closeEditModal}
        open={Boolean(editRune)}
        title={editRune ? editRune.name : 'Update rune'}
      >
        <div className="form-grid">
          <Field label="Tags">
            <TagSelector
              onToggle={value =>
                setEditForm(current => ({
                  ...current,
                  tags: toggleValue(current.tags, value),
                }))
              }
              options={tagOptions}
              selectedValues={editForm.tags}
            />
          </Field>

          <label className="checkbox-row">
            <input
              checked={editForm.expires}
              onChange={event =>
                setEditForm(current => ({
                  ...current,
                  expires: event.target.checked,
                  expirationDate: event.target.checked ? current.expirationDate : '',
                }))
              }
              type="checkbox"
            />
            <span>Rune expires</span>
          </label>

          {editForm.expires ? (
            <Field label="Expiration date">
              <input
                className="control-input"
                onChange={event =>
                  setEditForm(current => ({
                    ...current,
                    expirationDate: event.target.value,
                  }))
                }
                type="date"
                value={editForm.expirationDate}
              />
            </Field>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
