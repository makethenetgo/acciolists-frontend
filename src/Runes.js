import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Runes = () => {
  const [runes, setRunes] = useState([]);
  const [expires, setExpires] = useState(false);
  const [expirationDate, setExpirationDate] = useState(null);
  const [tags, setTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const fetchRunes = async () => {
    try {
      const response = await axios.get('/api/runes');
      setRunes(response.data);
    } catch (error) {
      console.error('Error fetching runes:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get('/api/tags');
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    fetchRunes(); // Initial fetch of runes
    fetchTags(); // Initial fetch of tags
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const newRune = document.getElementById('newRune').value;
    try {
      const response = await axios.post('/api/runes', { name: newRune, expires, expirationDate, tags: selectedTags });
      console.log('Rune created:', response.data);
      fetchRunes();  // Call fetchRunes to refresh the list
      setSelectedTags([]);
      setTagInput('');
    } catch (error) {
      console.error('Error creating rune:', error);
    }
  };

  const handleTagInput = (e) => {
    const input = e.target.value;
    setTagInput(input);
    if (input.length > 0) {
      setFilteredTags(tags.filter(tag => tag.toLowerCase().includes(input.toLowerCase())));
    } else {
      setFilteredTags([]);
    }
  };

  const handleTagSelect = (tag) => {
    setSelectedTags([...selectedTags, tag]);
    setTagInput('');
    setFilteredTags([]);
  };

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
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Type to search tags" 
                    value={tagInput} 
                    onChange={handleTagInput} 
                  />
                </div>
                {filteredTags.length > 0 && (
                  <ul className="list-group">
                    {filteredTags.map(tag => (
                      <li 
                        key={tag} 
                        className="list-group-item list-group-item-action" 
                        onClick={() => handleTagSelect(tag)}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2">
                  {selectedTags.map(tag => (
                    <span key={tag} className="badge badge-primary mr-2">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="form-group text-left">
                <label htmlFor="runeExpires" className="d-block text-left">Expires</label>
                <div className="d-flex justify-content-left">
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="flexRadioExpires" id="flexRadioExpires1" value="true" onChange={() => setExpires(true)} />
                    <label className="form-check-label" htmlFor="flexRadioExpires1">True</label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="flexRadioExpires" id="flexRadioExpires2" value="false" defaultChecked onChange={() => setExpires(false)} />
                    <label className="form-check-label" htmlFor="flexRadioExpires2">False</label>
                  </div>
                </div>
              </div>
              {expires && (
                <div className="form-group text-left">
                  <label htmlFor="expirationDate" className="d-block text-left">Expiration Date</label>
                  <DatePicker
                    id="expirationDate"
                    selected={expirationDate}
                    onChange={(date) => setExpirationDate(date)}
                    dateFormat="yy/MM/dd"
                    placeholderText="Select expiration date"
                    className="form-control"
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
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Rune</th>
                  <th scope="col">Tags</th>
                  <th scope="col">Expiration</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {runes.map(rune => (
                  <tr key={rune._id}>
                    <td>{rune.name}</td>
                    <td>{rune.tags?.join(', ')}</td>
                    <td>{rune.expires ? 'True' : 'False'}</td>
                    <td>
                      <div className="d-flex justify-content-around">
                        <button onClick={() => console.log('Update clicked')} className="btn btn-success">Update</button>
                        <button onClick={() => axios.delete(`/api/runes/${rune._id}`).then(fetchRunes)} className="btn btn-danger">Delete</button>
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

export default Runes;
