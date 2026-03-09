import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  ColumnLayout,
  Container,
  ContentLayout,
  Flashbar,
  FormField,
  Header,
  Input,
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
  formatDateForDisplay,
  getErrorMessage,
  getTagOptions,
  normalizeDateInput,
  selectTagOptions,
  typeLabel,
  typeOptions,
} from './lib/api';

function createRuneForm() {
  return {
    name: '',
    tags: [],
    type: null,
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
    if (!createForm.name.trim() || !createForm.type?.value) {
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
      await api.post(`/api/runes/${createForm.type.value}`, {
        name: createForm.name.trim(),
        tags: createForm.tags.map(option => option.value),
        expires: createForm.expires,
        expiration_date: createForm.expires ? createForm.expirationDate : null,
      });
      setCreateForm(createRuneForm());
      setFlashItems([
        {
          id: 'runes-create-success',
          type: 'success',
          header: 'Rune created',
          content: `Added "${createForm.name.trim()}" to the ${typeLabel(createForm.type.value)} inventory.`,
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
      tags: selectTagOptions(tags, rune.tagNames || []),
      type: typeOptions.find(option => option.value === rune.type) || null,
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
        tags: editForm.tags.map(option => option.value),
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
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Create, filter, and maintain the rune inventory that feeds scroll generation."
          actions={
            <Button loading={loading} onClick={loadRunes}>
              Refresh
            </Button>
          }
        >
          Runes
        </Header>
      }
    >
      <SpaceBetween size="l">
        {flashItems.length > 0 && <Flashbar items={flashItems} />}

        <ColumnLayout columns={2} variant="text-grid">
          <Container header={<Header variant="h2">Create rune</Header>}>
            <SpaceBetween size="m">
              <FormField label="Rune value">
                <Input
                  value={createForm.name}
                  onChange={({ detail }) =>
                    setCreateForm(current => ({ ...current, name: detail.value }))
                  }
                  placeholder="Enter an IP, URL, or domain"
                />
              </FormField>
              <FormField label="Type">
                <Select
                  selectedOption={createForm.type}
                  options={typeOptions}
                  onChange={({ detail }) =>
                    setCreateForm(current => ({ ...current, type: detail.selectedOption }))
                  }
                  placeholder="Choose a rune type"
                />
              </FormField>
              <FormField label="Tags">
                <Multiselect
                  selectedOptions={createForm.tags}
                  options={tagOptions}
                  onChange={({ detail }) =>
                    setCreateForm(current => ({ ...current, tags: detail.selectedOptions }))
                  }
                  placeholder="Attach tags"
                />
              </FormField>
              <Checkbox
                checked={createForm.expires}
                onChange={({ detail }) =>
                  setCreateForm(current => ({
                    ...current,
                    expires: detail.checked,
                    expirationDate: detail.checked ? current.expirationDate : '',
                  }))
                }
              >
                Rune expires
              </Checkbox>
              {createForm.expires && (
                <FormField label="Expiration date">
                  <div className="acciolists-native-input-wrapper">
                    <input
                      className="acciolists-native-input"
                      type="date"
                      value={createForm.expirationDate}
                      onChange={event =>
                        setCreateForm(current => ({
                          ...current,
                          expirationDate: event.target.value,
                        }))
                      }
                    />
                  </div>
                </FormField>
              )}
              <Button variant="primary" onClick={createRune}>
                Create rune
              </Button>
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h2">Filters</Header>}>
            <SpaceBetween size="m">
              <Box color="text-body-secondary">
                Narrow the rune inventory by data type while searching by value, tag, or expiration.
              </Box>
              <SpaceBetween direction="horizontal" size="l">
                <Checkbox
                  checked={typeFilters.ip}
                  onChange={({ detail }) =>
                    setTypeFilters(current => ({ ...current, ip: detail.checked }))
                  }
                >
                  IP
                </Checkbox>
                <Checkbox
                  checked={typeFilters.url}
                  onChange={({ detail }) =>
                    setTypeFilters(current => ({ ...current, url: detail.checked }))
                  }
                >
                  URL
                </Checkbox>
                <Checkbox
                  checked={typeFilters.domain}
                  onChange={({ detail }) =>
                    setTypeFilters(current => ({ ...current, domain: detail.checked }))
                  }
                >
                  Domain
                </Checkbox>
              </SpaceBetween>
            </SpaceBetween>
          </Container>
        </ColumnLayout>

        <Container
          header={
            <Header variant="h2" counter={`(${filteredRunes.length})`}>
              Rune inventory
            </Header>
          }
        >
          <Table
            items={filteredRunes}
            loading={loading}
            loadingText="Loading runes"
            wrapLines
            empty={
              <Box textAlign="center" color="text-body-secondary">
                No runes match the current filters.
              </Box>
            }
            filter={
              <TextFilter
                filteringText={searchText}
                filteringPlaceholder="Find runes by value, tag, or type"
                filteringAriaLabel="Filter runes"
                countText={`${filteredRunes.length} matches`}
                onChange={({ detail }) => setSearchText(detail.filteringText)}
              />
            }
            columnDefinitions={[
              {
                id: 'name',
                header: 'Rune',
                cell: item => item.name,
              },
              {
                id: 'type',
                header: 'Type',
                cell: item => typeLabel(item.type),
              },
              {
                id: 'tags',
                header: 'Tags',
                cell: item =>
                  item.tagDetails.length > 0 ? (
                    <div className="acciolists-pill-row">
                      {item.tagDetails.map(tag => (
                        <TagPill key={`${item._id}-${tag.name}`} tag={tag} />
                      ))}
                    </div>
                  ) : (
                    <Box color="text-body-secondary">No tags</Box>
                  ),
              },
              {
                id: 'expiration',
                header: 'Expiration',
                cell: item =>
                  item.expires ? formatDateForDisplay(item.expiration_date) : 'Never',
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: item => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => openEditModal(item)}>Update</Button>
                    <Button onClick={() => deleteRune(item)}>Delete</Button>
                  </SpaceBetween>
                ),
              },
            ]}
          />
        </Container>

        <Modal
          visible={Boolean(editRune)}
          onDismiss={closeEditModal}
          header={editRune ? `Update ${editRune.name}` : 'Update rune'}
          closeAriaLabel="Close rune modal"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={closeEditModal}>Cancel</Button>
                <Button variant="primary" onClick={updateRune}>
                  Save changes
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Tags">
              <Multiselect
                selectedOptions={editForm.tags}
                options={tagOptions}
                onChange={({ detail }) =>
                  setEditForm(current => ({ ...current, tags: detail.selectedOptions }))
                }
                placeholder="Attach tags"
              />
            </FormField>
            <Checkbox
              checked={editForm.expires}
              onChange={({ detail }) =>
                setEditForm(current => ({
                  ...current,
                  expires: detail.checked,
                  expirationDate: detail.checked ? current.expirationDate : '',
                }))
              }
            >
              Rune expires
            </Checkbox>
            {editForm.expires && (
              <FormField label="Expiration date">
                <div className="acciolists-native-input-wrapper">
                  <input
                    className="acciolists-native-input"
                    type="date"
                    value={editForm.expirationDate}
                    onChange={event =>
                      setEditForm(current => ({
                        ...current,
                        expirationDate: event.target.value,
                      }))
                    }
                  />
                </div>
              </FormField>
            )}
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </ContentLayout>
  );
}
