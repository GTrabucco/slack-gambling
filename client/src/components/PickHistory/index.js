import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table } from 'react-bootstrap';
import axios from 'axios'
import { useAuth0 } from "@auth0/auth0-react";
import './style.css'

const PickHistory = () => {
    const [error, setError] = useState("");
    const [picks, setPicks] = useState([])
    const { user } = useAuth0();
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

    useEffect(() => {
        const fetchPickHistory = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-pick-history`, {
                    params: {
                        username: user.name
                    }
                });

                if (response.data != null) {
                    setPicks(response.data);
                }
            } catch (error) {
                setError('Error fetching picks');
            }
        };

        fetchPickHistory();
    }, [])

    return (
        <Container>
            <Row>
                <h2>Pick History</h2>
            </Row>
            <Row>
                <table striped bordered hover class="ph-table">
                    <thead>
                        <tr>
                        <th>Submitted</th>
                        <th>Pick</th>
                        <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {picks.map((item) => (
                            <tr key={item._id} class="ph-row">
                                <td class="ph-cell">{new Date(item.createdAt).toLocaleString()}</td>
                                <td class="ph-cell">{item.text}</td>
                                <td class="ph-cell">{item.result}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Row>
        </Container>
    );
}

export default PickHistory;