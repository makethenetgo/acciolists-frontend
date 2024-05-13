import React, { useState, useEffect, useRef } from 'react';
import { ChromePicker } from 'react-color';
import axios from 'axios';

const Tags = () => {
  const [color, setColor] = useState('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const pickerRef = useRef(null);  // Reference to the color picker container
  const containerRef = useRef(null); // Reference to the container that holds the input and picker

  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState(null);

  const handleColorChange = (newColor) => {
    setColor(newColor.hex);

    if (currentTag) {
      axios.put(`/api/tags/${currentTag}`, { color: newColor.hex })
        .then(response => {
          console.log('Update successful:', response);
          fetchTags();
          setCurrentTag(null);
        })
        .catch(error => {
          console.error('There was an error!', error);
        });
    }
  };  

  const handleDelete = (id) => {
    axios.delete(`/api/tags/${id}`)
      .then(response => {
        console.log('Delete successful:', response);
        fetchTags();
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  };

  const fetchTags = () => {
    axios.get('/api/tags')
      .then(response => {
        setTags(response.data);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  };

  useEffect(() => {
    axios.get('/api/tags')
      .then(response => {
        setTags(response.data);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const url = `/api/tags`; // Append your endpoint to the base URL

    const payload = {
      name: document.getElementById('newTag').value,
      color: color
    };

    // Make the POST request
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (response.ok) { // Check if the status code is 200-299
        return response.json().then(data => {
          console.log('Success:', data);
          alert(`Success: ${data} created`);
          fetchTags();
        });
      } else {
        return response.json().then(data => {
          console.error('Error:', data.detail);
          alert(`❌ ${response.status} ${data.detail}`); // Use data.message if your API returns a specific message, else use response.statusText
        });
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('❌ Network or server error');
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="table-margin">
      <div className="row">
        <div className="col-sm">
          <div className="column-box">
            <h2><strong>Create New Tag</strong></h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group form-spacing">
                <label className="form-spacing" htmlFor="newTag">Tag</label>
                <input type="text" className="form-control" id="newTag" placeholder="Muggle" required />
              </div>
              <div className="form-group form-spacing" ref={containerRef}>
                <label className="form-spacing" htmlFor="tagColor">Color</label>
                <div className="input-group">
                  <input type="text" className="form-control" id="tagColor" placeholder="#ffffff" value={color} readOnly />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <img src="/colorwheel.png" alt="Pick Color" style={{ height: '25px', cursor: 'pointer'}} onClick={() => setShowColorPicker(show => !show)} />
                    </div>
                  </div>
                </div>
                {showColorPicker && (
                  <div ref={pickerRef} style={{ position: 'absolute', zIndex: 2 }}>
                    <ChromePicker
                      color={color}
                      onChangeComplete={handleColorChange}
                    />
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary form-spacing">Create</button>
            </form>
          </div>
        </div>
        <div className="col-sm">
          <div className="column-box">
            <h2><strong>Tag List</strong></h2>
            <table className="table">
              <thead>
                <tr className="table-active">
                  <th scope="col" className="hidden">ID</th>
                  <th scope="col">Tag</th>
                  <th scope="col">Color</th>
                  <th scope="col">Update</th>
                  <th scope="col">Delete</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag, index) => (
                  <tr key={index}>
                    <td className="hidden">{tag._id}</td>
                    <td>{tag.name}</td>
                    <td style={{cursor: 'pointer'}} onClick={() => {setColor(tag.color); setCurrentTag(tag._id); setShowColorPicker(true);}}>{tag.color}</td>
                    <td><button type="button" className="btn btn-primary">Update</button></td>
                    <td><button type="button" className="btn btn-danger" onClick={() => handleDelete(tag._id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tags;
