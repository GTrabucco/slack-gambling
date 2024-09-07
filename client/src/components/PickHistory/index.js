import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/AuthProvider";
import { Container, Row, Col, Table, Button } from 'react-bootstrap';
import axios from 'axios'

const PickHistory = ()=>{
    const [error, setError] = useState("");
    const [picks, setPicks] = useState([])
    const auth = useAuth();

    useEffect(()=>{
        const fetchPickHistory = async () => {
            try {
            const response = await axios.get(`${auth.apiBaseUrl}/api/get-pick-history`, {
                params: {
                    username: auth.user?.username
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
              <Col>
                <Table>
                    <thead>
                        <tr>
                            <th>Created At</th>
                            <th>Bet</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {picks
                            .sort((a, b) => new Date(a["createdAt"]) - new Date(b["createdAt"]))
                            .map((pick) => {
                                let text = pick["text"]
                                let result = pick["result"]
                                let createdAt = pick["createdAt"]
                                return (
                                    <tr key={pick["_id"]}>
                                        <td>{new Date(createdAt).toLocaleString()}</td>
                                        <td>{text}</td>
                                        <td>{result}</td>
                                    </tr>
                                );
                        })}
                    </tbody>
                </Table>       
              </Col>
            </Row>
        </Container>       
      );
}

export default PickHistory;