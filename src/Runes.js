// import React, { useState, useEffect, useRef } from 'react';
// import { ChromePicker } from 'react-color';
// import axios from 'axios';
// import colorwheel from './assets/colorwheel.png'; // Adjust the path as necessary

// const Runes = () => {
//   const [createColor, setCreateColor] = useState('#ffffff');
//   const [showCreatePicker, setShowCreatePicker] = useState(false);
//   const createPickerRef = useRef(null);
//   const createPickerButtonRef = useRef(null);

//   const [runes, setRunes] = useState([]);
//   const [pickerStates, setPickerStates] = useState(new Map());
//   const [tempColors, setTempColors] = useState(new Map());

//   const fetchRunes = async () => {
//     try {
//       const response = await axios.get('/api/runes');
//       setRunes(response.data);
//       const initialPickerStates = new Map();
//       const initialTempColors = new Map();
//       response.data.forEach(rune => {
//         initialPickerStates.set(rune._id, { show: false, ref: React.createRef() });
//         initialTempColors.set(rune._id, rune.color);
//       });
//       setPickerStates(initialPickerStates);
//       setTempColors(initialTempColors);
//     } catch (error) {
//       console.error('Error fetching runes:', error);
//     }
//   };

//   useEffect(() => {
//     fetchRunes(); // Initial fetch of runes
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (showCreatePicker && createPickerRef.current && !createPickerRef.current.contains(event.target) && !createPickerButtonRef.current.contains(event.target)) {
//         setShowCreatePicker(false);
//       }
//       pickerStates.forEach((value, key) => {
//         if (value.show && value.ref.current && !value.ref.current.contains(event.target)) {
//           const updatedStates = new Map(pickerStates);
//           updatedStates.set(key, { ...value, show: false });
//           setPickerStates(updatedStates);
//         }
//       });
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [showCreatePicker, pickerStates]);

//   const handleCreateSubmit = async (e) => {
//     e.preventDefault();
//     const newRune = document.getElementById('newRune').value;
//     try {
//       const response = await axios.post('/api/runes', { name: newRune, color: createColor });
//       console.log('Rune created:', response.data);
//       fetchRunes();  // Call fetchRunes to refresh the list
//     } catch (error) {
//       console.error('Error creating rune:', error);
//     }
//   };

//   const handleColorChange = (runeId, newColor) => {
//     const updatedTempColors = new Map(tempColors);
//     updatedTempColors.set(runeId, newColor.hex);
//     setTempColors(updatedTempColors);
//   };

//   const updateRuneColor = async (runeId) => {
//     try {
//       await axios.put(`/api/runes/${runeId}`, { color: tempColors.get(runeId) });
//       console.log('Color updated');
//       fetchRunes();
//     } catch (error) {
//       console.error('Error updating color:', error);
//     }
//   };

//   const togglePicker = (runeId) => {
//     const updatedStates = new Map(pickerStates);
//     const currentState = updatedStates.get(runeId);
//     updatedStates.set(runeId, { ...currentState, show: !currentState.show });
//     setPickerStates(updatedStates);
//   };

//   return (
//     <div className="table-margin">
//       <div className="row">
//         <div className="col-sm">
//           <div className="column-box">
//             <h2><strong>Create New Rune</strong></h2>
//             <form onSubmit={handleCreateSubmit}>
//               <div className="form-group">
//                 <label htmlFor="newRune">Rune</label>
//                 <input type="text" className="form-control" id="newRune" placeholder="Enter rune name" required />
//               </div>
//               <div className="form-group">
//                 <label htmlFor="runeColor">Color</label>
//                 <div className="input-group">
//                   <input type="text" className="form-control" value={createColor} readOnly />
//                   <div className="input-group-append">
//                     <button type="button" className="btn btn-outline-secondary" ref={createPickerButtonRef} onClick={() => setShowCreatePicker(true)}>
//                       <img src={colorwheel} alt="Pick Color" style={{ width: '20px', height: '20px' }} />
//                     </button>
//                   </div>
//                 </div>
//                 {showCreatePicker && (
//                   <div ref={createPickerRef} style={{ position: 'absolute', zIndex: 2 }} onClick={e => e.stopPropagation()}>
//                     <ChromePicker color={createColor} onChangeComplete={newColor => setCreateColor(newColor.hex)} />
//                   </div>
//                 )}
//               </div>
//               <button type="submit" className="btn btn-primary">Create</button>
//             </form>
//           </div>
//         </div>
//         <div className="col-sm">
//           <div className="column-box">
//             <h2><strong>Rune List</strong></h2>
//             <table className="table table-hover">
//               <thead>
//                 <tr>
//                   <th scope="col">Rune</th>
//                   <th scope="col">Color</th>
//                   <th scope="col">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {runes.map(rune => (
//                   <tr key={rune._id}>
//                     <td
//                       className="align-middle"
//                       style={{ cursor: 'pointer' }}
//                       onClick={() => togglePicker(rune._id)}
//                     >
//                       {tempColors.get(rune._id) !== rune.color && <span style={{ color: 'red', fontSize: '1.5em', verticalAlign: 'middle' }}>* </span>}
//                       {rune.name}
//                       {pickerStates.get(rune._id)?.show && (
//                         <div ref={pickerStates.get(rune._id).ref} style={{ position: 'absolute', zIndex: 2 }} onClick={e => e.stopPropagation()}>
//                           <ChromePicker color={tempColors.get(rune._id)} onChangeComplete={newColor => handleColorChange(rune._id, newColor)} />
//                         </div>
//                       )}
//                     </td>
//                     <td className="align-middle" style={{ cursor: 'pointer' }} onClick={() => togglePicker(rune._id)}>
//                       <div
//                         style={{
//                           backgroundColor: tempColors.get(rune._id),
//                           borderRadius: '5px',
//                           padding: '5px',
//                           display: 'inline-block',
//                           textAlign: 'center',
//                           minWidth: '60px'
//                         }}
//                       >
//                         {tempColors.get(rune._id)}
//                       </div>
//                     </td>
//                     <td className="align-middle">
//                       <div className="d-flex justify-content-around w-100">
//                         <button onClick={() => updateRuneColor(rune._id)} className="btn btn-success">Update</button>
//                         <button onClick={() => axios.delete(`/api/runes/${rune._id}`).then(fetchRunes)} className="btn btn-danger">Delete</button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Runes;
