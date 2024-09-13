import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Button, Form } from 'react-bootstrap';
import axios from 'axios';

const CalculateScoring = () => {
    const [error, setError] = useState("");
    const [picks, setPicks] = useState([]);
    const [filteredPicks, setFilteredPicks] = useState([]);
    const [betFilter, setBetFilter] = useState("");
    const [userFilter, setUserFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("")
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

    useEffect(() => {
        const fetchPickHistory = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-all-pick-history`);
                if (response.data != null) {  
                    setPicks(response.data);
                    setFilteredPicks(response.data);
                }
            } catch (error) {
                setError('Error fetching picks');
            }
        };

        fetchPickHistory();
    }, []);

    const handleResultChange = (event, pick) => {
        const value = event.target.value;
        if (!isNaN(value)) {
            setFilteredPicks((prevPicks) =>
                prevPicks.map((p) =>
                    p._id === pick["_id"]
                    ? { ...p, result: value }
                    : p
                )
            );
        }
    };

    const handleUpdateResult = async (id, updatedResult) => {
        try {
          await axios.post(`${apiBaseUrl}/api/update-pick-history`, {
            id: id,
            result: updatedResult
          });
        } catch (error) {
          console.error('Error updating result:', error);
        }
    };

    useEffect(() => {
        if (betFilter) {
            const filtered = picks.filter(pick =>
                pick.text.toLowerCase().includes(betFilter.toLowerCase())
            );
            setFilteredPicks(filtered);
        } else {
            setFilteredPicks(picks);
        }
    }, [betFilter, picks]);

    useEffect(() => {
        if (userFilter) {
            const filtered = picks.filter(pick =>
                pick.username.toLowerCase().includes(userFilter.toLowerCase())
            );
            setFilteredPicks(filtered);
        } else {
            setFilteredPicks(picks);
        }
    }, [userFilter, picks]);

    useEffect(() => {
        if (dateFilter) {
            const filtered = picks.filter(pick => 
                new Date(pick.createdAt).toLocaleString().includes(dateFilter)
            );
            setFilteredPicks(filtered);
        } else {
            setFilteredPicks(picks);
        }
    }, [dateFilter, picks]);

    return (
        <Container>
            <Row>
                <h2>Calculate Scoring</h2>
            </Row>
            <Row>
              <Col>
                <Table>
                    <thead>
                        <tr>
                            <th>
                                Created At
                                <br />
                                <input
                                    type="text"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                            </th>
                            <th>
                                User
                                <br />
                                <input
                                    type="text"
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                />
                            </th>
                            <th>
                                Bet
                                <br/>
                                <input
                                    type="text"
                                    value={betFilter}
                                    onChange={(e) =>
                                        setBetFilter(e.target.value )
                                    }
                                />
                            </th>
                            <th>Result</th>
                            <th></th>
                        </tr>                    
                    </thead>
                    <tbody>
                        {filteredPicks
                            .sort((a, b) => new Date(a["createdAt"]) - new Date(b["createdAt"]))
                            .map((pick) => {
                                let text = pick["text"];
                                let user = pick["username"];
                                let result = pick["result"];
                                let createdAt = pick["createdAt"];
                                return (
                                    <tr key={pick["_id"]}>
                                        <td>{new Date(createdAt).toLocaleString()}</td>
                                        <td>{user}</td>
                                        <td>{text}</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                min="-1"
                                                max="1"
                                                step="1"
                                                value={result}
                                                onChange={(e) => handleResultChange(e, pick)}
                                            />
                                        </td>
                                        <td>
                                            <Button onClick={() => handleUpdateResult(pick["_id"], result)}>
                                                Update
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            }
                        )}
                    </tbody>
                </Table>       
              </Col>
            </Row>
        </Container>       
    );
};

export default CalculateScoring;
