import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import './App.css';
import Tags from './Tags';
import Runes from './Runes';
import Scrolls from './scrolls';
import Dashboard from './Dashboard';

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
          <Route path="/" element={<Dashboard />} exact />
          <Route path="/tags" element={<Tags />} />
          <Route path="/runes" element={<Runes />} />
          <Route path="/scrolls" element={<Scrolls />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;