import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/AuthProvider";
import { Container, Row, Col, Table, Button } from 'react-bootstrap';
import axios from 'axios'

const Standings = ()=>{
    const [error, setError] = useState("");
    const [data, setData] = useState([]);
    const auth = useAuth();

    useEffect(()=>{
        const fetchStandings = async () => {
            try {
            const response = await axios.get(`${auth.apiBaseUrl}/api/get-standings`);   
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
        <Table striped bordered hover>
            <thead>
                <tr>
                <th>Name</th>
                <th>Points</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                <tr key={index}>
                    <td>{item.username}</td>
                    <td>{item.resultSum}</td>
                </tr>
                ))}
            </tbody>
        </Table>
    </Container>
    );
}

export default Standings;