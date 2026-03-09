import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  ColumnLayout,
  Container,
  ContentLayout,
  Flashbar,
  FormField,
  Header,
  Input,
  SpaceBetween,
  Table,
} from '@cloudscape-design/components';
import { api, getErrorMessage } from './lib/api';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashItems, setFlashItems] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [createColor, setCreateColor] = useState('#2f6fed');
  const [tagColors, setTagColors] = useState({});

  const loadTags = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/tags');
      setTags(response.data);
      setTagColors(
        Object.fromEntries(
          response.data.map(tag => [tag._id, tag.color || '#2f6fed'])
        )
      );
      setFlashItems([]);
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
      setCreateColor('#2f6fed');
      setFlashItems([
        {
          id: 'tags-create-success',
          type: 'success',
          header: 'Tag created',
          content: `Created the "${newTagName.trim()}" tag.`,
        },
      ]);
      await loadTags();
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
        color: tagColors[tag._id] || tag.color || '#2f6fed',
      });
      setFlashItems([
        {
          id: `tags-update-${tag._id}`,
          type: 'success',
          header: 'Tag updated',
          content: `Updated the "${tag.name}" color token.`,
        },
      ]);
      await loadTags();
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
      await loadTags();
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
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Define the labels and color tokens used to group runes and assemble scrolls."
          actions={
            <Button loading={loading} onClick={loadTags}>
              Refresh
            </Button>
          }
        >
          Tags
        </Header>
      }
    >
      <SpaceBetween size="l">
        {flashItems.length > 0 && <Flashbar items={flashItems} />}

        <ColumnLayout columns={2} variant="text-grid">
          <Container header={<Header variant="h2">Create tag</Header>}>
            <SpaceBetween size="m">
              <FormField label="Name">
                <Input
                  value={newTagName}
                  onChange={({ detail }) => setNewTagName(detail.value)}
                  placeholder="Enter a tag name"
                />
              </FormField>
              <FormField label="Color">
                <div className="acciolists-native-input-wrapper">
                  <input
                    className="acciolists-native-input acciolists-native-input--color"
                    type="color"
                    value={createColor}
                    onChange={event => setCreateColor(event.target.value)}
                  />
                </div>
              </FormField>
              <Button variant="primary" onClick={createTag}>
                Create tag
              </Button>
            </SpaceBetween>
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                counter={`(${tags.length})`}
              >
                Palette
              </Header>
            }
          >
            <Table
              items={tags}
              loading={loading}
              loadingText="Loading tags"
              empty={
                <Box textAlign="center" color="text-body-secondary">
                  No tags have been created yet.
                </Box>
              }
              columnDefinitions={[
                {
                  id: 'name',
                  header: 'Tag',
                  cell: item => item.name,
                },
                {
                  id: 'swatch',
                  header: 'Color',
                  cell: item => (
                    <div className="acciolists-color-preview">
                      <span
                        className="acciolists-color-swatch"
                        style={{ backgroundColor: tagColors[item._id] || item.color || '#2f6fed' }}
                      />
                      <span>{tagColors[item._id] || item.color || '#2f6fed'}</span>
                    </div>
                  ),
                },
                {
                  id: 'editor',
                  header: 'Adjust',
                  cell: item => (
                    <div className="acciolists-native-input-wrapper">
                      <input
                        className="acciolists-native-input acciolists-native-input--color"
                        type="color"
                        value={tagColors[item._id] || item.color || '#2f6fed'}
                        onChange={event =>
                          setTagColors(current => ({
                            ...current,
                            [item._id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: item => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={() => updateTag(item)}>Update</Button>
                      <Button onClick={() => deleteTag(item)}>Delete</Button>
                    </SpaceBetween>
                  ),
                },
              ]}
            />
          </Container>
        </ColumnLayout>
      </SpaceBetween>
    </ContentLayout>
  );
}
