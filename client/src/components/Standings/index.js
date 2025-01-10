import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Nav } from 'react-bootstrap';
import axios from 'axios'
import './style.css'
import { useNavigate } from "react-router-dom";

const Standings = () => {
    const [error, setError] = useState("");
    const [data, setData] = useState([]);
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStandings = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-standings`);
                if (response.data != null) {
                    setData(response.data);
                }
            } catch (error) {
                setError('Error fetching picks');
            }
        };

        fetchStandings();
    }, [])

    return (
        <Container>
            <Row>
                <h2>Standings</h2>
            </Row>
            {error && <div className="alert alert-danger">{error}</div>}
            <table class="s-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index}>
                            <td class="s-cell">
                                <Nav.Link
                                    key={`/pickhistory/${item.username}`}
                                    onClick={() => navigate(`/pickhistory?user=${item.username}`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {item.username}
                                </Nav.Link>
                            </td>
                            <td class="s-cell">{item.resultSum}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Container>
    );
}

export default Standings;