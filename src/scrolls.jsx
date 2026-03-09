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
  Link,
  Modal,
  Multiselect,
  Select,
  SpaceBetween,
  Table,
  TextFilter,
} from '@cloudscape-design/components';
import TagPill from './components/TagPill';
import {
  api,
  buildTagLookup,
  getErrorMessage,
  getTagOptions,
  selectTagOptions,
  typeLabel,
  typeOptions,
} from './lib/api';

function createScrollForm() {
  return {
    name: '',
    type: null,
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

function filterSelectableTags(options, lockedOptions, selectedOptions) {
  const lockedValues = new Set(lockedOptions.map(option => option.value));
  const selectedValues = new Set(selectedOptions.map(option => option.value));

  return options.filter(
    option => !lockedValues.has(option.value) || selectedValues.has(option.value)
  );
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
  const createIncludeOptions = filterSelectableTags(
    tagOptions,
    createForm.excludeTags,
    createForm.includeTags
  );
  const createExcludeOptions = filterSelectableTags(
    tagOptions,
    createForm.includeTags,
    createForm.excludeTags
  );
  const editIncludeOptions = filterSelectableTags(
    tagOptions,
    editForm.excludeTags,
    editForm.includeTags
  );
  const editExcludeOptions = filterSelectableTags(
    tagOptions,
    editForm.includeTags,
    editForm.excludeTags
  );

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
    if (!createForm.name.trim() || !createForm.type?.value) {
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
        type: createForm.type.value,
        include_tags: createForm.includeTags.map(option => option.value),
        exclude_tags: createForm.excludeTags.map(option => option.value),
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
      type: typeOptions.find(option => option.value === scroll.type) || null,
      includeTags: selectTagOptions(tags, scroll.includeTagNames),
      excludeTags: selectTagOptions(tags, scroll.excludeTagNames),
    });
  };

  const closeEditModal = () => {
    setEditScroll(null);
    setEditForm(createScrollForm());
  };

  const updateScroll = async () => {
    if (!editScroll || !editForm.type?.value) {
      return;
    }

    try {
      await api.put(`/api/scrolls/${editScroll._id}`, {
        name: editForm.name.trim(),
        type: editForm.type.value,
        include_tags: editForm.includeTags.map(option => option.value),
        exclude_tags: editForm.excludeTags.map(option => option.value),
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
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Assemble materialized lists from rune tags and publish them as generated scroll artifacts."
          actions={
            <Button loading={loading} onClick={loadScrolls}>
              Refresh
            </Button>
          }
        >
          Scrolls
        </Header>
      }
    >
      <SpaceBetween size="l">
        {flashItems.length > 0 && <Flashbar items={flashItems} />}

        <ColumnLayout columns={2} variant="text-grid">
          <Container header={<Header variant="h2">Create scroll</Header>}>
            <SpaceBetween size="m">
              <FormField label="Scroll name">
                <Input
                  value={createForm.name}
                  onChange={({ detail }) =>
                    setCreateForm(current => ({ ...current, name: detail.value }))
                  }
                  placeholder="Enter a scroll name"
                />
              </FormField>
              <FormField label="Rune type">
                <Select
                  selectedOption={createForm.type}
                  options={typeOptions}
                  onChange={({ detail }) =>
                    setCreateForm(current => ({ ...current, type: detail.selectedOption }))
                  }
                  placeholder="Choose the rune inventory"
                />
              </FormField>
              <FormField label="Include tags">
                <Multiselect
                  selectedOptions={createForm.includeTags}
                  options={createIncludeOptions}
                  onChange={({ detail }) =>
                    setCreateForm(current => ({
                      ...current,
                      includeTags: detail.selectedOptions,
                    }))
                  }
                  placeholder="Select tags that should be included"
                />
              </FormField>
              <FormField label="Exclude tags">
                <Multiselect
                  selectedOptions={createForm.excludeTags}
                  options={createExcludeOptions}
                  onChange={({ detail }) =>
                    setCreateForm(current => ({
                      ...current,
                      excludeTags: detail.selectedOptions,
                    }))
                  }
                  placeholder="Select tags that should be excluded"
                />
              </FormField>
              <Button variant="primary" onClick={createScroll}>
                Create scroll
              </Button>
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h2">Publication model</Header>}>
            <SpaceBetween size="m">
              <Box color="text-body-secondary">
                Scrolls are generated artifacts. Include tags define the source set, exclude tags carve out exceptions, and the published file remains available even if the API is offline.
              </Box>
              <Box variant="awsui-key-label">Artifact path pattern</Box>
              <Box>/scrolls/&lt;scroll-name&gt;</Box>
            </SpaceBetween>
          </Container>
        </ColumnLayout>

        <Container
          header={
            <Header variant="h2" counter={`(${filteredScrolls.length})`}>
              Published scrolls
            </Header>
          }
        >
          <Table
            items={filteredScrolls}
            loading={loading}
            loadingText="Loading scrolls"
            wrapLines
            empty={
              <Box textAlign="center" color="text-body-secondary">
                No scrolls match the current filters.
              </Box>
            }
            filter={
              <TextFilter
                filteringText={searchText}
                filteringPlaceholder="Find scrolls by name, type, or tag"
                filteringAriaLabel="Filter scrolls"
                countText={`${filteredScrolls.length} matches`}
                onChange={({ detail }) => setSearchText(detail.filteringText)}
              />
            }
            columnDefinitions={[
              {
                id: 'name',
                header: 'Scroll',
                cell: item => item.name,
              },
              {
                id: 'type',
                header: 'Type',
                cell: item => typeLabel(item.type),
              },
              {
                id: 'include',
                header: 'Include tags',
                cell: item =>
                  item.includeTagDetails.length > 0 ? (
                    <div className="acciolists-pill-row">
                      {item.includeTagDetails.map(tag => (
                        <TagPill key={`${item._id}-include-${tag.name}`} tag={tag} />
                      ))}
                    </div>
                  ) : (
                    <Box color="text-body-secondary">No include tags</Box>
                  ),
              },
              {
                id: 'exclude',
                header: 'Exclude tags',
                cell: item =>
                  item.excludeTagDetails.length > 0 ? (
                    <div className="acciolists-pill-row">
                      {item.excludeTagDetails.map(tag => (
                        <TagPill key={`${item._id}-exclude-${tag.name}`} tag={tag} />
                      ))}
                    </div>
                  ) : (
                    <Box color="text-body-secondary">No exclude tags</Box>
                  ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: item => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Link
                      external
                      href={`${window.location.origin}/scrolls/${item.name}`}
                      externalIconAriaLabel="Opens in a new tab"
                    >
                      View scroll
                    </Link>
                    <Button onClick={() => openEditModal(item)}>Update</Button>
                    <Button onClick={() => deleteScroll(item)}>Delete</Button>
                  </SpaceBetween>
                ),
              },
            ]}
          />
        </Container>

        <Modal
          visible={Boolean(editScroll)}
          onDismiss={closeEditModal}
          header={editScroll ? `Update ${editScroll.name}` : 'Update scroll'}
          closeAriaLabel="Close scroll modal"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={closeEditModal}>Cancel</Button>
                <Button variant="primary" onClick={updateScroll}>
                  Save changes
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Scroll name">
              <Input
                value={editForm.name}
                onChange={({ detail }) =>
                  setEditForm(current => ({ ...current, name: detail.value }))
                }
              />
            </FormField>
            <FormField label="Rune type">
              <Select
                selectedOption={editForm.type}
                options={typeOptions}
                onChange={({ detail }) =>
                  setEditForm(current => ({ ...current, type: detail.selectedOption }))
                }
              />
            </FormField>
            <FormField label="Include tags">
              <Multiselect
                selectedOptions={editForm.includeTags}
                options={editIncludeOptions}
                onChange={({ detail }) =>
                  setEditForm(current => ({
                    ...current,
                    includeTags: detail.selectedOptions,
                  }))
                }
                placeholder="Select tags that should be included"
              />
            </FormField>
            <FormField label="Exclude tags">
              <Multiselect
                selectedOptions={editForm.excludeTags}
                options={editExcludeOptions}
                onChange={({ detail }) =>
                  setEditForm(current => ({
                    ...current,
                    excludeTags: detail.selectedOptions,
                  }))
                }
                placeholder="Select tags that should be excluded"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </ContentLayout>
  );
}
