import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { Dropdown } from 'react-bootstrap';

const Runes = () => {
  const [runes, setRunes] = useState([]);
  const [expires, setExpires] = useState(false);
  const [expirationDate, setExpirationDate] = useState(null);
  const [tags, setTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [runeType, setRuneType] = useState('');
  const [filterIP, setFilterIP] = useState(true);
  const [filterURL, setFilterURL] = useState(true);
  const [filterDomain, setFilterDomain] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableRune, setEditableRune] = useState(null);
  const originalRuneRef = useRef(null);
  const [modalError, setModalError] = useState(null); // State for modal error message
  const [updateTagInput, setUpdateTagInput] = useState('');
  const [updateFilteredTags, setUpdateFilteredTags] = useState([]);
  const [updateSelectedTags, setUpdateSelectedTags] = useState([]);
  const [selectedType, setSelectedType] = useState(''); // Initialize with an empty string or a default type


  useEffect(() => {
    fetchRunes();
    fetchTags();
  }, [filterIP, filterURL, filterDomain]);

  const fetchRunes = async () => {
    const endpoints = [
      { type: 'IP', url: `${process.env.API_URL}/api/runes/ip`, enabled: filterIP },
      { type: 'URL', url: `${process.env.API_URL}/api/runes/url`, enabled: filterURL },
      { type: 'Domain', url: `${process.env.API_URL}/api/runes/domain`, enabled: filterDomain },
    ];

    try {
      const responses = await Promise.all(
        endpoints
          .filter(endpoint => endpoint.enabled)
          .map(endpoint =>
            axios.get(endpoint.url).then(response =>
              Promise.all(response.data.map(async rune => {
                const tagsWithDetails = await Promise.all(rune.tags.map(async tagName =>
                  axios.get(`${process.env.API_URL}/api/tags?name=${tagName}`).then(tagResponse =>
                    tagResponse.data[0]
                  )
                ));
                return {
                  ...rune,
                  type: endpoint.type,
                  tags: tagsWithDetails,
                  expiration_date_display: rune.expiration_date ? moment.utc(rune.expiration_date).local().format('MMM DD, YYYY') : null // Add formatted date
                };
              }))
            )
          )
      );
      setRunes(responses.flat());
    } catch (error) {
      console.error('Error fetching runes:', error);
    }
  };

  const openEditModal = (rune) => {
    console.log("Opening modal for rune:", rune);
    setEditableRune(rune);
    originalRuneRef.current = rune;

    // *** Set the UPDATE tags state ***
    setUpdateSelectedTags(rune.tags || []); // Initialize with existing tags
    setUpdateTagInput(''); // Clear the input
    setUpdateFilteredTags([]); // Clear the filtered tags
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    console.log("Closing modal.");
    setIsModalOpen(false);
    setEditableRune(null);
    originalRuneRef.current = null;

    // *** Clear UPDATE tags state when modal closes ***
    setUpdateSelectedTags([]);
    setUpdateTagInput('');
    setUpdateFilteredTags([]);
  };


  const handleExpirationToggle = (value) => {
    setExpires(value);
    if (!value) {
      setExpirationDate(null);
    }
  };

  const displayExpiration = (rune) => {
    if (!rune.expires) {
        return 'Never';
    }
    if (rune.expiration_date) {
        // *** Use moment.js for local time formatting ***
        return moment.utc(rune.expiration_date).local().format('MMM DD, YYYY');
    }
    return 'No date set';
  };

  const handleDateChange = (date) => {
    setExpirationDate(date);
    console.log("New expiration date set:", date);
  };

  const updateRune = async () => {
    if (!originalRuneRef.current) {
        console.error("Error: No original rune reference found.");
        return;
    }

    const originalRune = originalRuneRef.current;
    console.log("Original Rune at Update:", originalRune);
    console.log("Editable Rune at Update:", editableRune);

    setModalError(null);

    const updatedRune = {
        ...editableRune,
        tags: updateSelectedTags.map(t => t.name),
        expires: editableRune.expires,
        expiration_date: editableRune.expires
            ? (editableRune.expiration_date
                ? new Date(editableRune.expiration_date).toISOString().split('T')[0]
                : null)
            : null,
    };

    if (!updatedRune || !updatedRune.hasOwnProperty('expires') || !updatedRune.hasOwnProperty('tags') || !updatedRune.hasOwnProperty('expiration_date')) {
        console.error("Error: Updated rune object is missing required properties.");
        return;
    }

    let payload = {};
    let changesDetected = false;

    const hasChanged = (originalValue, newValue) => {
        if (typeof originalValue === 'boolean' && typeof newValue === 'boolean') {
            return originalValue !== newValue;
        }
        if (originalValue instanceof Date && newValue instanceof Date) {
            return originalValue.getTime() !== newValue.getTime();
        }
        if ((originalValue === null || originalValue === undefined) && (newValue !== null && newValue !== undefined)) return true;
        if ((newValue === null || newValue === undefined) && (originalValue !== null && originalValue !== undefined)) return true;
        if ((originalValue === null || originalValue === undefined) && (newValue === null || newValue === undefined)) return false;
        return originalValue !== newValue;
    };

    if (hasChanged(originalRune.expires, updatedRune.expires)) {
        payload.expires = updatedRune.expires;
        changesDetected = true;
        console.log("Expires changed");
    }

    const originalDate = originalRune.expiration_date ? new Date(originalRune.expiration_date) : null;
    const updatedDate = updatedRune.expiration_date ? new Date(updatedRune.expiration_date) : null;
    if (hasChanged(originalDate, updatedDate)) {
        payload.expiration_date = updatedRune.expiration_date;
        changesDetected = true;
        console.log("Expiration Date changed");
    }

    if (updatedRune.expires && !updatedRune.expiration_date) {
        setModalError("Please select an expiration date.");
        return;
    }

    const originalTags = originalRune.tags ? originalRune.tags.map(tag => tag.name).sort() : [];
    const updatedTags = updatedRune.tags ? updatedRune.tags.sort() : [];

    if (originalTags.length !== updatedTags.length || !originalTags.every((value, index) => value === updatedTags[index])) {
        payload.tags = updatedTags;
        changesDetected = true;
        console.log("Tags Updated");
    }

    if (changesDetected) {
      try {
          console.log("payload:", payload);
          const response = await axios.put(`${process.env.API_URL}/api/runes/${updatedRune.type.toLowerCase()}/${updatedRune._id}`, payload);
          console.log('Rune updated:', response.data);
  
          // Update the runes state with the response data
          setRunes(prevRunes =>
              prevRunes.map(rune => {
                  console.log('Checking rune:', rune._id, updatedRune._id);
                  if (rune._id === updatedRune._id) {
                      console.log('Updating rune with:', response.data);
                      return {
                          ...rune, // spread the old rune data
                          ...response.data, // apply the updated rune data
                          tags: updateSelectedTags, // ensure the updated tags are applied
                          expiration_date_display: response.data.expiration_date 
                              ? moment.utc(response.data.expiration_date).local().format('MMM DD, YYYY')
                              : "Never", // ensure formatted date for display
                      };
                  }
                  return rune; // return the unchanged rune
              })
          );
  
          closeEditModal();
      } catch (error) {
          console.error('Error updating rune:', error);
          if (error.response) {
              console.error("Server responded with status code:", error.response.status);
              console.error("Response data:", error.response.data);
          } else if (error.request) {
              console.error("No response received:", error.request);
          } else {
              console.error("Error setting up the request:", error.message);
          }
      }
  } else {
      console.log("No changes detected.");
      closeEditModal();
  }  
};

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${process.env.API_URL}/api/tags`);
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const newRune = document.getElementById('newRune').value.trim();
    const runeEndpoint = `${process.env.API_URL}/api/runes/${selectedType.toLowerCase()}`;

    try {
      const requestBody = {
        name: newRune,
        tags: selectedTags.map(tag => tag.name),
        expires: expires,
        expiration_date: expires ? (expirationDate ? expirationDate.toISOString().split('T')[0] : null) : null,
      };

      const response = await axios.post(runeEndpoint, requestBody);
      console.log('Rune created:', response.data);
      fetchRunes();
      setSelectedTags([]);
      setTagInput('');
    } catch (error) {
      console.error('Error creating rune:', error);
      alert(`Failed to create rune: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleTagInput = (e) => {
    const input = e.target.value;
    setTagInput(input);

    if (input.length > 0) {
        setFilteredTags(
            tags.filter(tag =>
                tag.name.toLowerCase().includes(input.toLowerCase()) &&
                !selectedTags.some(selectedTag => selectedTag._id === tag._id)
            )
        );
    } else {
        // *** This is the crucial change ***
        setFilteredTags(tags.filter(tag =>
            !selectedTags.some(selectedTag => selectedTag._id === tag._id)
        ));
    }
  };

  const handleUpdateTagInput = (e) => {
      const input = e.target.value;
      setUpdateTagInput(input);

      if (input.length > 0) {
          setUpdateFilteredTags(
              tags.filter(tag =>
                  tag.name.toLowerCase().includes(input.toLowerCase()) &&
                  !updateSelectedTags.some(selectedTag => selectedTag._id === tag._id)
              )
          );
      } else {
          // *** This is the crucial change ***
          setUpdateFilteredTags(tags.filter(tag =>
              !updateSelectedTags.some(selectedTag => selectedTag._id === tag._id)
          ));
      }
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prevIndex =>
          prevIndex < filteredTags.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prevIndex =>
          prevIndex > 0 ? prevIndex - 1 : 0
        );
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredTags.length) {
          e.preventDefault();
          handleTagSelect(filteredTags[highlightedIndex]);
        }
        break;
      default:
        break;
    }
  };

  const handleUpdateKeyDown = (e) => {
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            setHighlightedIndex(prevIndex => prevIndex < updateFilteredTags.length - 1 ? prevIndex + 1 : prevIndex);
            break;
        case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : 0);
            break;
        case 'Enter':
            if (highlightedIndex >= 0 && highlightedIndex < updateFilteredTags.length) {
                e.preventDefault();
                handleUpdateTagSelect(updateFilteredTags[highlightedIndex]);
            }
            break;
        default:
            break;
    }
  };

  const handleTagSelect = (tag) => {
    if (!selectedTags.some(selectedTag => selectedTag._id === tag._id)) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput('');
      setFilteredTags([]);
      setHighlightedIndex(-1);
    }
  };

  const handleUpdateTagSelect = (tag) => {
    if (!updateSelectedTags.some(selectedTag => selectedTag._id === tag._id)) {
        setUpdateSelectedTags([...updateSelectedTags, tag]);
        setUpdateTagInput('');
        setUpdateFilteredTags([]);
        setHighlightedIndex(-1);
    }
  };

  const handleRemoveUpdateTag = (tagToRemove) => {
    setUpdateSelectedTags(updateSelectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const deleteRune = async (rune) => {
    if (!rune.type) {
      console.error("Rune type is undefined.");
      return;
    }
    const url = `${process.env.API_URL}/api/runes/${rune.type.toLowerCase()}/${rune._id}`;

    try {
      await axios.delete(url);
      fetchRunes();
    } catch (error) {
      console.error('Error deleting rune:', error);
      alert('Failed to delete rune: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const filteredRunes = runes.filter(rune =>
    rune.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rune.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rune.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())) || // Access tag.name here
    (rune.expires && rune.expiration_date ? new Date(rune.expiration_date).toLocaleDateString().toLowerCase().includes(searchTerm.toLowerCase()) : 'never'.includes(searchTerm.toLowerCase()))
  );

  function validateColor(color) {
    const defaultColor = '#CCCCCC';
    if (typeof color !== 'string' || !/^#[0-9A-F]{6}$/i.test(color)) {
      return defaultColor;
    }
    return color;
  }

  function isLight(color) {
    if (!color) return true;
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }

  return (
    <div className="table-margin">
      <div className="row">
        <div className="col-sm">
          <div className="column-box">
            <h2><strong>Create New Rune</strong></h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group text-left">
                <label htmlFor="newRune" className="d-block text-left">Name</label>
                <input type="text" className="form-control" id="newRune" placeholder="Enter rune name" required />
              </div>
              <div className="form-group text-left">
                <label htmlFor="runeTags" className="d-block text-left">Tags</label>
                <div className="input-group" style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '5px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                  {selectedTags.map(tag => (
                    <span key={tag._id} style={{
                      backgroundColor: validateColor(tag.color),
                      color: isLight(validateColor(tag.color)) ? 'black' : 'white',
                      fontWeight: 'bold',
                      padding: '5px 10px',
                      margin: '2px',
                      borderRadius: '5px'
                    }}>
                      {tag.name}
                      <button type="button" onClick={() => handleRemoveTag(tag)} style={{ marginLeft: '5px', border: 'none', background: 'none', color: isLight(tag.color) ? 'black' : 'white', cursor: 'pointer' }}>×</button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Type to search tags" 
                    value={tagInput} 
                    onChange={handleTagInput}
                    onKeyDown={handleKeyDown}
                    style={{ flex: '1', border: 'none', margin: '2px' }}
                  />
                  {filteredTags.length > 0 && (
                    <ul className="list-group mt-2" style={{ width: '100%' }}>
                      {filteredTags.map((tag, index) => (
                        <li 
                          key={tag._id}
                          className={`list-group-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                          onClick={() => handleTagSelect(tag)}
                          onMouseOver={() => setHighlightedIndex(index)}
                        >
                          {tag.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="form-group text-left">
                <label htmlFor="runeType" className="d-block text-left">Type</label>
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
              <div className="form-group text-left">
                <label htmlFor="runeExpires" className="d-block text-left">Expires</label>
                <div className="d-flex justify-content-left">
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="flexRadioExpires" id="flexRadioExpires1"
                          value="true" checked={expires === true} onChange={() => handleExpirationToggle(true)} />
                    <label className="form-check-label" htmlFor="flexRadioExpires1">True</label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="flexRadioExpires" id="flexRadioExpires2"
                          value="false" checked={expires === false} onChange={() => handleExpirationToggle(false)} />
                    <label className="form-check-label" htmlFor="flexRadioExpires2">False</label>
                  </div>
                </div>
              </div>
              {expires && (
                <div className="form-group text-left">
                  <label htmlFor="expirationDate" className="d-block text-left">Expiration Date</label>
                  <DatePicker
                    selected={expirationDate ? new Date(expirationDate) : null}
                    onChange={date => setExpirationDate(date)}
                    dateFormat="MMM dd, yyyy"
                    placeholderText="Select expiration date"
                  />
                </div>
              )}
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
          </div>
        </div>
        <div className="col-sm">
          <div className="column-box">
            <h2><strong>Rune List</strong></h2>
            <div className="d-flex align-items-center mb-3">
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" id="ipCheckbox" checked={filterIP} onChange={e => setFilterIP(e.target.checked)} />
                <label className="form-check-label" htmlFor="ipCheckbox">IP</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" id="urlCheckbox" checked={filterURL} onChange={e => setFilterURL(e.target.checked)} />
                <label className="form-check-label" htmlFor="urlCheckbox">URL</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" id="domainCheckbox" checked={filterDomain} onChange={e => setFilterDomain(e.target.checked)} />
                <label className="form-check-label" htmlFor="domainCheckbox">Domain</label>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="Search runes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: 'auto', flexGrow: 1 }}
              />
            </div>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Rune</th>
                  <th scope="col">Type</th>
                  <th scope="col">Tags</th>
                  <th scope="col">Expiration</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRunes.map(rune => (
                  <tr key={rune._id}>
                    <td>{rune.name}</td>
                    <td>{rune.type}</td>
                    <td>{rune.tags.map((tag, index) => (
                      <span key={index} style={{
                        backgroundColor: validateColor(tag.color),
                        color: isLight(validateColor(tag.color)) ? 'black' : 'white',
                        padding: '3px 6px',
                        marginRight: '5px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {tag.name}
                      </span>
                    ))}</td>
                    <td>{rune.expiration_date_display || "Never"}</td>
                    <td>
                      <div className="d-flex justify-content-around">
                        <button onClick={() => openEditModal(rune)} className="btn btn-success">Update</button>
                        <button onClick={() => deleteRune(rune)} className="btn btn-danger">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <form onSubmit={(e) => {
                e.preventDefault();
                updateRune();
            }}>
              <h3>{editableRune.name}</h3>
              <div className="form-group">
                <label>Tags:</label>
                <div className="input-group" style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '5px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                  {updateSelectedTags.map(tag => (
                    <span key={tag._id} style={{
                      backgroundColor: validateColor(tag.color),
                      color: isLight(validateColor(tag.color)) ? 'black' : 'white',
                      fontWeight: 'bold',
                      padding: '5px 10px',
                      margin: '2px',
                      borderRadius: '5px'
                    }}>
                      {tag.name}
                      <button type="button" onClick={() => handleRemoveUpdateTag(tag)} style={{ marginLeft: '5px', border: 'none', background: 'none', color: isLight(tag.color) ? 'black' : 'white', cursor: 'pointer' }}>×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type to search tags"
                    value={updateTagInput} 
                    onChange={handleUpdateTagInput} 
                    onKeyDown={handleUpdateKeyDown}
                    style={{ flex: '1', border: 'none', margin: '2px' }}
                  />
                  {updateFilteredTags.length > 0 && (
                    <ul className="list-group mt-2" style={{ width: '100%' }}>
                      {updateFilteredTags.map((tag, index) => (
                        <li 
                          key={tag._id}
                          className={`list-group-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                          onClick={() => handleUpdateTagSelect(tag)}
                          onMouseOver={() => setHighlightedIndex(index)}
                        >
                          {tag.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Expires:</label>
                <input
                  type="checkbox"
                  checked={editableRune?.expires || false}
                  onChange={(e) => setEditableRune({...editableRune, expires: e.target.checked})}
                />
              </div>
              {editableRune?.expires && (
                <div className="form-group">
                  <label>Expiration Date:</label>
                  <DatePicker
                    selected={editableRune?.expiration_date ? new Date(editableRune.expiration_date) : null}
                    onChange={(date) => setEditableRune({...editableRune, expiration_date: date})}
                    dateFormat="MMM dd, yyyy"
                    className="form-control"
                  />
                </div>
              )}
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
  );
  
};

export default Runes;
