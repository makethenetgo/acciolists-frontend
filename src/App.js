import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import './App.css';
import Tags from './Tags';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar bg="light" expand="sm">
          <Navbar.Brand as={Link} to="/">AccioLists</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link as={Link} to="/runes">Runes</Nav.Link>
              <Nav.Link as={Link} to="/scrolls">Scrolls</Nav.Link>
              <Nav.Link as={Link} to="/tags">Tags</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        <Routes>
          <Route path="/tags" element={<Tags />} />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;