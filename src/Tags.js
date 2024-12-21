import React, { useState, useEffect, useRef } from 'react';
import { ChromePicker } from 'react-color';
import axios from 'axios';
import colorwheel from './assets/colorwheel.png'; // Adjust the path as necessary

const Tags = () => {
  const [createColor, setCreateColor] = useState('#ffffff');
  const [showCreatePicker, setShowCreatePicker] = useState(false);
  const createPickerRef = useRef(null);
  const createPickerButtonRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [pickerStates, setPickerStates] = useState(new Map());
  const [tempColors, setTempColors] = useState(new Map());
  const apiUrl = process.env.API_URL || "";


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
    const newTag = document.getElementById('newTag').value;
    try {
      const response = await axios.post(`${apiUrl}/api/tags`, { name: newTag, color: createColor });
      console.log('Tag created:', response.data);
      fetchTags();  // Call fetchTags to refresh the list
    } catch (error) {
      console.error('Error creating tag:', error);
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
            <h2><strong>Create New Tag</strong></h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label htmlFor="newTag">Tag</label>
                <input type="text" className="form-control" id="newTag" placeholder="Enter tag name" required />
              </div>
              <div className="form-group">
                <label htmlFor="tagColor">Color</label>
                <div className="input-group">
                  <input type="text" className="form-control" value={createColor} readOnly />
                  <div className="input-group-append">
                    <button type="button" className="btn btn-outline-secondary" ref={createPickerButtonRef} onClick={() => setShowCreatePicker(true)}>
                      <img src={colorwheel} alt="Pick Color" style={{ width: '20px', height: '20px' }} />
                    </button>
                  </div>
                </div>
                {showCreatePicker && (
                  <div ref={createPickerRef} style={{ position: 'absolute', zIndex: 2 }} onClick={e => e.stopPropagation()}>
                    <ChromePicker color={createColor} onChangeComplete={newColor => setCreateColor(newColor.hex)} />
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
          </div>
        </div>
        <div className="col-sm">
          <div className="column-box">
            <h2><strong>Tag List</strong></h2>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Tag</th>
                  <th scope="col">Color</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map(tag => (
                  <tr key={tag._id}>
                    <td
                      className="align-middle"
                      style={{ cursor: 'pointer' }}
                      onClick={() => togglePicker(tag._id)}
                    >
                      {tempColors.get(tag._id) !== tag.color && <span style={{ color: 'red', fontSize: '1.5em', verticalAlign: 'middle' }}>* </span>}
                      {tag.name}
                      {pickerStates.get(tag._id)?.show && (
                        <div ref={pickerStates.get(tag._id).ref} style={{ position: 'absolute', zIndex: 2 }} onClick={e => e.stopPropagation()}>
                          <ChromePicker color={tempColors.get(tag._id)} onChangeComplete={newColor => handleColorChange(tag._id, newColor)} />
                        </div>
                      )}
                    </td>
                    <td className="align-middle" style={{ cursor: 'pointer' }} onClick={() => togglePicker(tag._id)}>
                      <div
                        style={{
                          backgroundColor: tempColors.get(tag._id),
                          borderRadius: '5px',
                          padding: '5px',
                          display: 'inline-block',
                          textAlign: 'center',
                          minWidth: '60px'
                        }}
                      >
                        {tempColors.get(tag._id)}
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex justify-content-around w-100">
                        <button onClick={() => updateTagColor(tag._id)} className="btn btn-success">Update</button>
                        <button onClick={() => axios.delete(`${apiUrl}/api/tags/${tag._id}`).then(fetchTags)} className="btn btn-danger">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tags;
