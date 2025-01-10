import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table } from 'react-bootstrap';
import axios from 'axios'
import { useAuth0 } from "@auth0/auth0-react";
import './style.css'
import { useLocation } from 'react-router-dom';

const WeekPicks = (props) => {
    const [error, setError] = useState("");
    const [picks, setPicks] = useState([])
    const { user } = useAuth0();
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const userParam = queryParams.get('user');
    const usernameDisplay = userParam ? userParam : user.name

    useEffect(() => {
        const fetchPickHistory = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-weekly-picks`);

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
                <h5>Week Picks</h5>
            </Row>
            <Row>
                <table striped bordered hover class="wp-table">
                    <thead>
                        <tr>
                        <th>Submitted</th>
                        <th>User</th>
                        <th>Pick</th>
                        </tr>
                    </thead>
                    <tbody>
                        {picks.map((item) => (
                            <tr key={item._id} class="wp-row">
                                <td class="wp-cell">{new Date(item.createdAt).toLocaleString()}</td>
                                <td class="wp-cell">{item.username}</td>
                                <td class="wp-cell">{item.text}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Row>
        </Container>
    );
}

export default WeekPicks;