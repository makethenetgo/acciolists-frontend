import React, { useEffect, useState } from 'react';
import {
  Button,
  DataTable,
  Field,
  FlashMessages,
  PageHero,
  Panel,
} from './components/ui';
import { api, getErrorMessage, getRandomTagColor } from './lib/api';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashItems, setFlashItems] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [createColor, setCreateColor] = useState('#7df9c5');
  const [tagColors, setTagColors] = useState({});

  const loadTags = async (options = {}) => {
    setLoading(true);

    try {
      const response = await api.get('/api/tags');
      const nextTags = response.data || [];
      setTags(nextTags);
      setTagColors(
        Object.fromEntries(nextTags.map(tag => [tag._id, tag.color || '#7df9c5']))
      );
      if (options.clearFlash !== false) {
        setFlashItems([]);
      }
    } catch (error) {
      setFlashItems([
        {
          id: 'tags-load-error',
          type: 'error',
          header: 'Unable to load tags',
          content: getErrorMessage(error, 'The control plane could not retrieve tag data.'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const createTag = async () => {
    if (!newTagName.trim()) {
      setFlashItems([
        {
          id: 'tags-validation-error',
          type: 'warning',
          header: 'Tag name required',
          content: 'Provide a name before creating a new tag.',
        },
      ]);
      return;
    }

    try {
      await api.post('/api/tags', {
        name: newTagName.trim(),
        color: createColor,
      });
      setNewTagName('');
      setCreateColor('#7df9c5');
      setFlashItems([
        {
          id: 'tags-create-success',
          type: 'success',
          header: 'Tag created',
          content: `Created the "${newTagName.trim()}" tag.`,
        },
      ]);
      await loadTags({ clearFlash: false });
    } catch (error) {
      setFlashItems([
        {
          id: 'tags-create-error',
          type: 'error',
          header: 'Tag creation failed',
          content: getErrorMessage(error, 'The tag could not be created.'),
        },
      ]);
    }
  };

  const updateTag = async tag => {
    try {
      await api.put(`/api/tags/${tag._id}`, {
        color: tagColors[tag._id] || tag.color || '#7df9c5',
      });
      setFlashItems([
        {
          id: `tags-update-${tag._id}`,
          type: 'success',
          header: 'Tag updated',
          content: `Updated the "${tag.name}" color token.`,
        },
      ]);
      await loadTags({ clearFlash: false });
    } catch (error) {
      setFlashItems([
        {
          id: `tags-update-error-${tag._id}`,
          type: 'error',
          header: 'Tag update failed',
          content: getErrorMessage(error, `The "${tag.name}" tag could not be updated.`),
        },
      ]);
    }
  };

  const deleteTag = async tag => {
    if (!window.confirm(`Delete the "${tag.name}" tag?`)) {
      return;
    }

    try {
      await api.delete(`/api/tags/${tag._id}`);
      setFlashItems([
        {
          id: `tags-delete-${tag._id}`,
          type: 'success',
          header: 'Tag deleted',
          content: `Deleted the "${tag.name}" tag.`,
        },
      ]);
      await loadTags({ clearFlash: false });
    } catch (error) {
      setFlashItems([
        {
          id: `tags-delete-error-${tag._id}`,
          type: 'error',
          header: 'Tag delete failed',
          content: getErrorMessage(error, `The "${tag.name}" tag could not be deleted.`),
        },
      ]);
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        actions={
          <Button loading={loading} onClick={loadTags} variant="primary">
            Refresh tags
          </Button>
        }
        description="Maintain the labels shared by rune inventory and scroll rules."
        eyebrow="Taxonomy"
        title="Tags"
      />

      <FlashMessages items={flashItems} />

      <Panel kicker="Create" title="New tag">
          <div className="form-grid form-grid--inline">
            <Field label="Name">
              <input
                className="control-input"
                onChange={event => setNewTagName(event.target.value)}
                placeholder="Enter a tag name"
                type="text"
                value={newTagName}
              />
            </Field>

            <Field label="Color">
              <div className="color-field">
                <Button
                  className="color-field__random"
                  onClick={() => setCreateColor(getRandomTagColor())}
                >
                  Random
                </Button>
                <input
                  className="color-field__picker"
                  onChange={event => setCreateColor(event.target.value)}
                  type="color"
                  value={createColor}
                />
                <code>{createColor}</code>
              </div>
            </Field>

            <div className="panel-footer">
              <Button onClick={createTag} variant="primary">
                Create tag
              </Button>
            </div>
          </div>
      </Panel>

      <Panel
        kicker="Taxonomy"
        title={`Tags (${tags.length})`}
      >
        <DataTable
          columns={[
            {
              id: 'name',
              header: 'Tag',
              render: item => <span className="table-primary">{item.name}</span>,
            },
            {
              id: 'current',
              header: 'Current color',
              render: item => (
                <div className="color-chip">
                  <span
                    className="color-chip__swatch"
                    style={{ backgroundColor: tagColors[item._id] || item.color || '#7df9c5' }}
                  />
                  <code>{tagColors[item._id] || item.color || '#7df9c5'}</code>
                </div>
              ),
            },
            {
              id: 'adjust',
              header: 'Adjust',
              render: item => (
                <div className="color-field">
                  <Button
                    className="color-field__random"
                    onClick={() =>
                      setTagColors(current => ({
                        ...current,
                        [item._id]: getRandomTagColor(),
                      }))
                    }
                  >
                    Random
                  </Button>
                  <input
                    className="color-field__picker"
                    onChange={event =>
                      setTagColors(current => ({
                        ...current,
                        [item._id]: event.target.value,
                      }))
                    }
                    type="color"
                    value={tagColors[item._id] || item.color || '#7df9c5'}
                  />
                </div>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              render: item => (
                <div className="table-actions">
                  <Button onClick={() => updateTag(item)}>Update</Button>
                  <Button onClick={() => deleteTag(item)} variant="danger">
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          emptyMessage="No tags have been created yet."
          loading={loading}
          loadingMessage="Loading tags…"
          rowKey={item => item._id}
          rows={tags}
        />
      </Panel>
    </div>
  );
}
