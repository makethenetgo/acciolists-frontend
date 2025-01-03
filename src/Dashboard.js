import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table } from 'react-bootstrap';

const Dashboard = () => {
  const [runeCounts, setRuneCounts] = useState({ IP: 0, URL: 0, Domain: 0 });
  const [tagCount, setTagCount] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);
  const apiUrl = process.env.API_URL || "";

  useEffect(() => {
    fetchRunes();
    fetchTagCount();
    fetchScrollCount();
  }, []);

  const fetchRunes = async () => {
    try {
      const ip = await axios.get(`${apiUrl}/api/runes/ip`);
      const url = await axios.get(`${apiUrl}/api/runes/url`);
      const domain = await axios.get(`${apiUrl}/api/runes/domain`);

      setRuneCounts({
        IP: ip.data.length,
        URL: url.data.length,
        Domain: domain.data.length
      });
    } catch (error) {
      console.error('Error fetching rune counts:', error);
    }
  };

  const fetchTagCount = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/tags`);
      setTagCount(response.data.length);
    } catch (error) {
      console.error('Error fetching tag count:', error);
    }
  };

  const fetchScrollCount = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/scrolls`);
      setScrollCount(response.data.length);
    } catch (error) {
      console.error('Error fetching scroll count:', error);
    }
  };

  // Calculate total runes
  const totalRunes = runeCounts.IP + runeCounts.URL + runeCounts.Domain;

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header as="h5">Resource Counts</Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>All Runes</th>
                <th>IP Runes</th>
                <th>URL Runes</th>
                <th>Domain Runes</th>
                <th>Tags</th>
                <th>Scrolls</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{totalRunes}</td>
                <td>{runeCounts.IP}</td>
                <td>{runeCounts.URL}</td>
                <td>{runeCounts.Domain}</td>
                <td>{tagCount}</td>
                <td>{scrollCount}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;
