import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'react-bootstrap';


const Scrolls = () => {
  const [createColor, setCreateColor] = useState('#ffffff');
  const [showCreatePicker, setShowCreatePicker] = useState(false);
  const createPickerRef = useRef(null);
  const createPickerButtonRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [pickerStates, setPickerStates] = useState(new Map());
  const [tempColors, setTempColors] = useState(new Map());
  const apiUrl = process.env.API_URL || "";
  const [selectedType, setSelectedType] = useState('');
  const [includeTags, setIncludeTags] = useState([]);
  const [excludeTags, setExcludeTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [filteredTags, setFilteredTags] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [scrolls, setScrolls] = useState([]); // Added to store scroll data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [includeFilteredTags, setIncludeFilteredTags] = useState([]);
  const [excludeFilteredTags, setExcludeFilteredTags] = useState([]);
  const [includeTagInput, setIncludeTagInput] = useState('');
  const [excludeTagInput, setExcludeTagInput] = useState('');
  const [includeHighlightedIndex, setIncludeHighlightedIndex] = useState(-1);
  const [excludeHighlightedIndex, setExcludeHighlightedIndex] = useState(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableScroll, setEditableScroll] = useState(null);
  const originalScrollRef = useRef(null);
  const [modalError, setModalError] = useState(null);
  const [updateIncludeTagInput, setUpdateIncludeTagInput] = useState('');
  const [updateExcludeTagInput, setUpdateExcludeTagInput] = useState('');
  const [updateIncludeFilteredTags, setUpdateIncludeFilteredTags] = useState([]);
  const [updateExcludeFilteredTags, setUpdateExcludeFilteredTags] = useState([]);
  const [updateIncludeTags, setUpdateIncludeTags] = useState([]);
  const [updateExcludeTags, setUpdateExcludeTags] = useState([]);
  const [updateIncludeHighlightedIndex, setUpdateIncludeHighlightedIndex] = useState(-1);
  const [updateExcludeHighlightedIndex, setUpdateExcludeHighlightedIndex] = useState(-1);
  const [updateSelectedType, setUpdateSelectedType] = useState('');

  const fetchScrolls = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await axios.get(`${apiUrl}/api/scrolls`);
        console.log("Raw Scrolls Response:", response.data);

        const scrollsData = await Promise.all(response.data.map(async scroll => {
            console.log("Current Scroll:", scroll);

            const fetchTagsByName = async (tagNames) => {
                return await Promise.all(tagNames.map(async tagName => {
                    try {
                        const res = await axios.get(`${apiUrl}/api/tags?name=${tagName}`);
                        console.log(`Tag ${tagName} Response:`, res.data);
                        return res.data && res.data.length > 0 ? res.data[0] : null; // Get the first tag object
                    } catch (error) {
                        console.error(`Error fetching tag ${tagName}:`, error);
                        return null;
                    }
                })).then(results => results.filter(result => result !== null));
            };

            const includeTagsWithDetails = await fetchTagsByName(scroll.include_tags || []);
            const excludeTagsWithDetails = await fetchTagsByName(scroll.exclude_tags || []);

            return {
                ...scroll,
                includeTags: includeTagsWithDetails,
                excludeTags: excludeTagsWithDetails
            };
        }));

        setScrolls(scrollsData);
        console.log("Processed Scrolls Data:", scrollsData);
    } catch (error) {
        console.error('Error fetching scrolls:', error);
        setError('Failed to fetch scrolls: ' + error.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateIncludeTagInput = (e) => {
    const input = e.target.value;
    setUpdateIncludeTagInput(input);

    if (input.length > 0) {
        setUpdateIncludeFilteredTags(
            tags.filter(tag =>
                tag.name.toLowerCase().includes(input.toLowerCase()) &&
                !updateIncludeTags.some(selectedTag => selectedTag._id === tag._id) &&
                !updateExcludeTags.some(selectedTag => selectedTag._id === tag._id)
            )
        );
    } else {
        setUpdateIncludeFilteredTags([]);
    }
    setUpdateIncludeHighlightedIndex(-1);
};

const handleUpdateExcludeTagInput = (e) => {
    const input = e.target.value;
    setUpdateExcludeTagInput(input);

    if (input.length > 0) {
        setUpdateExcludeFilteredTags(
            tags.filter(tag =>
                tag.name.toLowerCase().includes(input.toLowerCase()) &&
                !updateIncludeTags.some(selectedTag => selectedTag._id === tag._id) &&
                !updateExcludeTags.some(selectedTag => selectedTag._id === tag._id)
            )
        );
    } else {
        setUpdateExcludeFilteredTags([]);
    }
    setUpdateExcludeHighlightedIndex(-1);
};

const handleUpdateTagSelect = (tag, type) => {
    if (type === 'include') {
        if (!updateIncludeTags.some(selectedTag => selectedTag._id === tag._id)) {
            setUpdateIncludeTags([...updateIncludeTags, tag]);
            setUpdateIncludeTagInput('');
            setUpdateIncludeFilteredTags([]);
            setUpdateIncludeHighlightedIndex(-1);
        }
    } else if (type === 'exclude') {
        if (!updateExcludeTags.some(selectedTag => selectedTag._id === tag._id)) {
            setUpdateExcludeTags([...updateExcludeTags, tag]);
            setUpdateExcludeTagInput('');
            setUpdateExcludeFilteredTags([]);
            setUpdateExcludeHighlightedIndex(-1);
        }
    }
};

const handleUpdateKeyDown = (e, type) => {
    let highlightedIndexSetter;
    let filteredTagsArray;
    let highlightedIndex;
    if (type === 'include') {
      highlightedIndexSetter = setUpdateIncludeHighlightedIndex;
      filteredTagsArray = updateIncludeFilteredTags;
      highlightedIndex = updateIncludeHighlightedIndex;
    } else if (type === 'exclude') {
      highlightedIndexSetter = setUpdateExcludeHighlightedIndex;
      filteredTagsArray = updateExcludeFilteredTags;
      highlightedIndex = updateExcludeHighlightedIndex;
    } else {
      return;
    }

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            highlightedIndexSetter(prevIndex =>
                prevIndex < filteredTagsArray.length - 1 ? prevIndex + 1 : prevIndex
            );
            break;
        case 'ArrowUp':
            e.preventDefault();
            highlightedIndexSetter(prevIndex =>
                prevIndex > 0 ? prevIndex - 1 : 0
            );
            break;
        case 'Enter':
            if (highlightedIndex >= 0 && highlightedIndex < filteredTagsArray.length) {
                e.preventDefault();
                handleUpdateTagSelect(filteredTagsArray[highlightedIndex], type);
            }
            break;
        default:
            break;
    }
};

const handleRemoveUpdateTag = (tagToRemove, type) => {
    if (type === 'include') {
      setUpdateIncludeTags(updateIncludeTags.filter(tag => tag._id !== tagToRemove._id));
    } else if (type === 'exclude') {
      setUpdateExcludeTags(updateExcludeTags.filter(tag => tag._id !== tagToRemove._id));
    }
  };

  const handleIncludeTagInput = (e) => {
    const input = e.target.value;
    setIncludeTagInput(input);

    if (input.length > 0) {
        setIncludeFilteredTags(
            tags.filter(tag =>
                tag.name.toLowerCase().includes(input.toLowerCase()) &&
                !includeTags.some(selectedTag => selectedTag._id === tag._id) &&
                !excludeTags.some(selectedTag => selectedTag._id === tag._id)
            )
        );
    } else {
        setIncludeFilteredTags([]);
    }
    setIncludeHighlightedIndex(-1);
};

const handleExcludeTagInput = (e) => {
    const input = e.target.value;
    setExcludeTagInput(input);

    if (input.length > 0) {
        setExcludeFilteredTags(
            tags.filter(tag =>
                tag.name.toLowerCase().includes(input.toLowerCase()) &&
                !includeTags.some(selectedTag => selectedTag._id === tag._id) &&
                !excludeTags.some(selectedTag => selectedTag._id === tag._id)
            )
        );
    } else {
        setExcludeFilteredTags([]);
    }
    setExcludeHighlightedIndex(-1);
};

const handleTagSelect = (tag, type) => {
  if (type === 'include') {
      if (!includeTags.some(selectedTag => selectedTag._id === tag._id)) {
          setIncludeTags([...includeTags, tag]);
          setIncludeTagInput('');
          setIncludeFilteredTags([]);
          setIncludeHighlightedIndex(-1);
      }
  } else if (type === 'exclude') {
      if (!excludeTags.some(selectedTag => selectedTag._id === tag._id)) {
          setExcludeTags([...excludeTags, tag]);
          setExcludeTagInput('');
          setExcludeFilteredTags([]);
          setExcludeHighlightedIndex(-1);
      }
  }
};

const handleKeyDown = (e, type) => {
    let highlightedIndexSetter;
    let filteredTagsArray;
    let highlightedIndex;

    if (type === 'include') {
        highlightedIndexSetter = setIncludeHighlightedIndex;
        filteredTagsArray = includeFilteredTags;
        highlightedIndex = includeHighlightedIndex;
    } else if (type === 'exclude') {
        highlightedIndexSetter = setExcludeHighlightedIndex;
        filteredTagsArray = excludeFilteredTags;
        highlightedIndex = excludeHighlightedIndex;
    } else {
        return;
    }

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            highlightedIndexSetter(prevIndex =>
                prevIndex < filteredTagsArray.length - 1 ? prevIndex + 1 : prevIndex
            );
            break;
        case 'ArrowUp':
            e.preventDefault();
            highlightedIndexSetter(prevIndex =>
                prevIndex > 0 ? prevIndex - 1 : 0
            );
            break;
        case 'Enter':
            if (highlightedIndex >= 0 && highlightedIndex < filteredTagsArray.length) {
                e.preventDefault();
                handleTagSelect(filteredTagsArray[highlightedIndex], type); // Use the correct type
            }
            break;
        default:
            break;
    }
  };

  useEffect(() => {
    fetchScrolls(); // Fetch scrolls on component mount
  }, []);

  const deleteScroll = async (scrollId) => {
    try {
      await axios.delete(`${apiUrl}/api/scrolls/${scrollId}`);
      fetchScrolls(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting scroll:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/tags`);
      setTags(response.data);
      const initialPickerStates = new Map();
      const initialTempColors = new Map();
      response.data.forEach(tag => {
        initialPickerStates.set(tag._id, { show: false, ref: React.createRef() });
        initialTempColors.set(tag._id, tag.color);
      });
      setPickerStates(initialPickerStates);
      setTempColors(initialTempColors);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    fetchTags(); // Initial fetch of tags
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreatePicker && createPickerRef.current && !createPickerRef.current.contains(event.target) && !createPickerButtonRef.current.contains(event.target)) {
        setShowCreatePicker(false);
      }
      pickerStates.forEach((value, key) => {
        if (value.show && value.ref.current && !value.ref.current.contains(event.target)) {
          const updatedStates = new Map(pickerStates);
          updatedStates.set(key, { ...value, show: false });
          setPickerStates(updatedStates);
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCreatePicker, pickerStates]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const newScroll = document.getElementById('newScroll').value;
    try {
        const response = await axios.post(`${apiUrl}/api/scrolls`, { 
            name: newScroll, 
            type: selectedType.toLowerCase(), 
            include_tags: includeTags.map(tag => tag.name), 
            exclude_tags: excludeTags.map(tag => tag.name) 
        });
        console.log('Scroll created:', response.data);
        fetchScrolls(); // Call fetchScrolls to refresh the list!
        setIncludeTags([]); // Clear include tags after creation
        setExcludeTags([]); // Clear exclude tags after creation
        setSelectedType(''); // Clear selected type after creation
        document.getElementById('newScroll').value = ''; // Clear input field
    } catch (error) {
        console.error('Error creating scroll:', error);
    }
  };

  const handleTagInput = (e) => {
    const input = e.target.value;
    setTagInput(input);
  
    if (input.length > 0) {
      setFilteredTags(
        tags.filter(tag =>
          tag.name.toLowerCase().includes(input.toLowerCase()) &&
          !includeTags.some(selectedTag => selectedTag._id === tag._id) &&
          !excludeTags.some(selectedTag => selectedTag._id === tag._id)
        )
      );
    } else {
      setFilteredTags([]);
    }
  };

  
  const handleRemoveTag = (tagToRemove, type) => {
    if (type === 'include') {
      setIncludeTags(includeTags.filter(tag => tag._id !== tagToRemove._id));
    } else if (type === 'exclude') {
      setExcludeTags(excludeTags.filter(tag => tag._id !== tagToRemove._id));
    }
  };  

  const handleColorChange = (tagId, newColor) => {
    const updatedTempColors = new Map(tempColors);
    updatedTempColors.set(tagId, newColor.hex);
    setTempColors(updatedTempColors);
  };

  const updateTagColor = async (tagId) => {
    try {
      await axios.put(`${apiUrl}/api/tags/${tagId}`, { color: tempColors.get(tagId) });
      console.log('Color updated');
      fetchTags();
    } catch (error) {
      console.error('Error updating color:', error);
    }
  };

  const openEditModal = (scroll) => {
    setEditableScroll(scroll);
    originalScrollRef.current = scroll;
    setUpdateIncludeTags(scroll.includeTags || []);
    setUpdateExcludeTags(scroll.excludeTags || []);
    setUpdateSelectedType(scroll.type);
    setIsModalOpen(true);
};

const closeEditModal = () => {
    setIsModalOpen(false);
    setEditableScroll(null);
    originalScrollRef.current = null;
    setModalError(null);
    setUpdateIncludeTags([]);
    setUpdateExcludeTags([]);
};

const updateScroll = async () => {
    if (!originalScrollRef.current) return;

    setModalError(null);
    const originalScroll = originalScrollRef.current;
    const updatedScroll = {
        ...editableScroll,
        include_tags: updateIncludeTags.map(tag => tag.name),
        exclude_tags: updateExcludeTags.map(tag => tag.name),
        type: updateSelectedType
    };

    let payload = {
        include_tags: null, // Default to null
        exclude_tags: null, // Default to null
    };
    let changesDetected = false;

    const hasChanged = (originalValue, newValue) => {
        if (Array.isArray(originalValue) && Array.isArray(newValue)) {
            if (originalValue.length !== newValue.length) return true;
            return !originalValue.every((v, i) => newValue[i] === v);
        }
        return originalValue !== newValue;
    };

    if (hasChanged(originalScroll.name, updatedScroll.name)) {
        payload.name = updatedScroll.name;
        changesDetected = true;
    }

    if (hasChanged(originalScroll.type, updatedScroll.type)) {
        payload.type = updatedScroll.type;
        changesDetected = true;
    }

    if (hasChanged(originalScroll.includeTags.map(t => t.name), updatedScroll.include_tags)) {
        payload.include_tags = updatedScroll.include_tags;
        changesDetected = true;
    } else {
        payload.include_tags = originalScroll.includeTags.map(t => t.name); // Preserve existing tags
    }

    if (hasChanged(originalScroll.excludeTags.map(t => t.name), updatedScroll.exclude_tags)) {
        payload.exclude_tags = updatedScroll.exclude_tags;
        changesDetected = true;
    } else {
        payload.exclude_tags = originalScroll.excludeTags.map(t => t.name); // Preserve existing tags
    }

    if (changesDetected) {
        try {
            const response = await axios.put(`${apiUrl}/api/scrolls/${editableScroll._id}`, payload);
            console.log('Scroll updated:', response.data);
            fetchScrolls();
            closeEditModal();
        } catch (error) {
            console.error('Error updating scroll:', error);
            setModalError("Failed to update scroll.");
        }
    } else {
        closeEditModal();
    }
};


  const togglePicker = (tagId) => {
    const updatedStates = new Map(pickerStates);
    const currentState = updatedStates.get(tagId);
    updatedStates.set(tagId, { ...currentState, show: !currentState.show });
    setPickerStates(updatedStates);
  };

  return (
    <div className="table-margin">
      <div className="row">
        <div className="col-sm">
          <div className="column-box">
            <h2><strong>Create New Scroll</strong></h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label htmlFor="newScroll">Scroll</label>
                <input type="text" className="form-control" id="newScroll" placeholder="Enter scroll name" required />
              </div>
              <div className="form-group text-left">
                <label htmlFor="scrollType" className="d-block text-left">Type</label>
                <Dropdown onSelect={(eventKey) => setSelectedType(eventKey)}>
                  <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                    {selectedType || "Select"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="IP">IP</Dropdown.Item>
                    <Dropdown.Item eventKey="URL">URL</Dropdown.Item>
                    <Dropdown.Item eventKey="Domain">Domain</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <div className="form-group">
                  <label htmlFor="includeTags">Include Tags</label>
                  <div className="input-group" style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '5px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}> {/* Added border and flexWrap */}
                      {includeTags.map(tag => (
                          <span key={tag._id} style={{
                              backgroundColor: tag.color || '#ccc',
                              color: '#fff',
                              padding: '5px',
                              margin: '2px',
                              borderRadius: '4px',
                              display: 'inline-flex', // Ensure tags are inline
                              alignItems: 'center'
                          }}>
                              {tag.name}
                              <button type="button" onClick={() => handleRemoveTag(tag, 'include')} style={{ marginLeft: '5px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
                          </span>
                      ))}
                      <input
                          type="text"
                          className="form-control"
                          placeholder="Search tags to include"
                          value={includeTagInput}
                          onChange={handleIncludeTagInput}
                          onKeyDown={(e) => handleKeyDown(e, 'include')}
                          style={{ flex: 1, border: 'none', margin: '2px' }} //Removed border
                      />
                  </div>
                  {includeFilteredTags.length > 0 && (
                      <ul className="list-group mt-2" style={{ width: '100%' }}> {/* Added width */}
                          {includeFilteredTags.map((tag, index) => (
                              <li
                                  key={tag._id}
                                  className={`list-group-item ${index === includeHighlightedIndex ? 'highlighted' : ''}`}
                                  onClick={() => handleTagSelect(tag, 'include')}
                                  onMouseOver={() => setIncludeHighlightedIndex(index)}
                              >
                                  {tag.name}
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
              <div className="form-group">
                  <label htmlFor="excludeTags">Exclude Tags</label>
                  <div className="input-group" style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '5px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}> {/* Added border and flexWrap */}
                      {excludeTags.map(tag => (
                          <span key={tag._id} style={{
                              backgroundColor: tag.color || '#ccc',
                              color: '#fff',
                              padding: '5px',
                              margin: '2px',
                              borderRadius: '4px',
                              display: 'inline-flex', // Ensure tags are inline
                              alignItems: 'center'
                          }}>
                              {tag.name}
                              <button type="button" onClick={() => handleRemoveTag(tag, 'exclude')} style={{ marginLeft: '5px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
                          </span>
                      ))}
                      <input
                          type="text"
                          className="form-control"
                          placeholder="Search tags to exclude"
                          value={excludeTagInput}
                          onChange={handleExcludeTagInput}
                          onKeyDown={(e) => handleKeyDown(e, 'exclude')}
                          style={{ flex: 1, border: 'none', margin: '2px' }} //Removed border
                      />
                  </div>
                  {excludeFilteredTags.length > 0 && (
                      <ul className="list-group mt-2" style={{ width: '100%' }}> {/* Added width */}
                          {excludeFilteredTags.map((tag, index) => (
                              <li
                                  key={tag._id}
                                  className={`list-group-item ${index === excludeHighlightedIndex ? 'highlighted' : ''}`}
                                  onClick={() => handleTagSelect(tag, 'exclude')}
                                  onMouseOver={() => setExcludeHighlightedIndex(index)}
                              >
                                  {tag.name}
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
          </div>
        </div>
        <div className="col-sm">
        <div className="table-margin">
          <div className="row">
          <div className="col-sm">
            <div className="column-box">
                <h2><strong>Scroll List</strong></h2>
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th scope="col">Scroll Name</th>
                            <th scope="col">Type</th>
                            <th scope="col">Include Tags</th>
                            <th scope="col">Exclude Tags</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scrolls.map((scroll) => (
                            <tr key={scroll._id}>
                                <td className="align-middle">{scroll.name}</td>
                                <td className="align-middle">{scroll.type}</td>
                                <td className="align-middle">
                                    {scroll.includeTags && scroll.includeTags.length > 0 ? (
                                        scroll.includeTags.map(tag => (
                                            tag && tag.name ? (
                                            <span key={tag._id} style={{
                                                backgroundColor: tag.color || '#ccc',
                                                color: '#fff',
                                                padding: '5px',
                                                marginRight: '5px',
                                                borderRadius: '5px',
                                                display: 'inline-block'
                                            }}>{tag.name}</span>
                                            ) : null
                                        ))
                                    ) : (
                                        <span>No Include Tags</span>
                                    )}
                                </td>
                                <td className="align-middle">
                                    {scroll.excludeTags && scroll.excludeTags.length > 0 ? (
                                        scroll.excludeTags.map(tag => (
                                            tag && tag.name ? (
                                            <span key={tag._id} style={{
                                                backgroundColor: tag.color || '#ccc',
                                                color: '#fff',
                                                padding: '5px',
                                                marginRight: '5px',
                                                borderRadius: '5px',
                                                display: 'inline-block'
                                            }}>{tag.name}</span>
                                            ) : null
                                        ))
                                    ) : (
                                        <span>No Exclude Tags</span>
                                    )}
                                </td>
                                <td className="align-middle">
                                    <div className="d-flex justify-content-around">
                                        <button className="btn btn-primary" onClick={() => window.open(`${apiUrl}/scrolls/${scroll.name}`, '_blank')} > View Scroll </button>
                                        <button onClick={() => openEditModal(scroll)} className="btn btn-success">Update</button>
                                        <button onClick={() => deleteScroll(scroll._id)} className="btn btn-danger">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
          {isModalOpen && (
            <div className="modal">
                <div className="modal-content">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        updateScroll();
                    }}>
                        <h3>{editableScroll.name}</h3>
                        <div className="form-group">
                            <label htmlFor="updateIncludeTags">Include Tags</label>
                            <div className="input-group" style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '5px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                                {updateIncludeTags.map(tag => (
                                    <span key={tag._id} style={{
                                        backgroundColor: tag.color || '#ccc',
                                        color: '#fff',
                                        padding: '5px',
                                        margin: '2px',
                                        borderRadius: '4px',
                                        display: 'inline-flex',
                                        alignItems: 'center'
                                    }}>
                                        {tag.name}
                                        <button type="button" onClick={() => handleRemoveUpdateTag(tag, 'include')} style={{ marginLeft: '5px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search tags to include"
                                    value={updateIncludeTagInput}
                                    onChange={handleUpdateIncludeTagInput}
                                    onKeyDown={(e) => handleUpdateKeyDown(e, 'include')}
                                    style={{ flex: 1, border: 'none', margin: '2px' }}
                                />
                            </div>
                            {updateIncludeFilteredTags.length > 0 && (
                                <ul className="list-group mt-2" style={{ width: '100%' }}>
                                    {updateIncludeFilteredTags.map((tag, index) => (
                                        <li
                                            key={tag._id}
                                            className={`list-group-item ${index === updateIncludeHighlightedIndex ? 'highlighted' : ''}`}
                                            onClick={() => handleUpdateTagSelect(tag, 'include')}
                                            onMouseOver={() => setUpdateIncludeHighlightedIndex(index)}
                                        >
                                            {tag.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="updateExcludeTags">Exclude Tags</label>
                            <div className="input-group" style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '5px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                                {updateExcludeTags.map(tag => (
                                    <span key={tag._id} style={{
                                        backgroundColor: tag.color || '#ccc',
                                        color: '#fff',
                                        padding: '5px',
                                        margin: '2px',
                                        borderRadius: '4px',
                                        display: 'inline-flex',
                                        alignItems: 'center'
                                    }}>
                                        {tag.name}
                                        <button type="button" onClick={() => handleRemoveUpdateTag(tag, 'exclude')} style={{ marginLeft: '5px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search tags to exclude"
                                    value={updateExcludeTagInput}
                                    onChange={handleUpdateExcludeTagInput}
                                    onKeyDown={(e) => handleUpdateKeyDown(e, 'exclude')}
                                    style={{ flex: 1, border: 'none', margin: '2px' }}
                                />
                            </div>
                            {updateExcludeFilteredTags.length > 0 && (
                                <ul className="list-group mt-2" style={{ width: '100%' }}>
                                    {updateExcludeFilteredTags.map((tag, index) => (
                                        <li
                                            key={tag._id}
                                            className={`list-group-item ${index === updateExcludeHighlightedIndex ? 'highlighted' : ''}`}
                                            onClick={() => handleUpdateTagSelect(tag, 'exclude')}
                                            onMouseOver={() => setUpdateExcludeHighlightedIndex(index)}
                                        >
                                            {tag.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {modalError && <div className="alert alert-danger">{modalError}</div>}
                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger" onClick={closeEditModal}>Cancel Changes</button>
                            <button type="submit" className="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
          )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Scrolls;
