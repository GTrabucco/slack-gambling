import React, { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/AuthProvider";
import { Container, Row, Col, Table, Button, Form } from 'react-bootstrap';
import axios from 'axios'

const CalculateScoring = ()=>{
    const [error, setError] = useState("");
    const [picks, setPicks] = useState([])
    const auth = useAuth()
    useEffect(()=>{
        const fetchPickHistory = async () => {
            try {
            const response = await axios.get(`${auth.apiBaseUrl}/api/get-all-pick-history`);
            
            if (response.data != null) {  
                setPicks(response.data);
            }
            } catch (error) {
                setError('Error fetching picks');
            }
        };

        fetchPickHistory();
    }, [])

    const handleResultChange = (event, pick) => {
        const value = event.target.value;
        if (!isNaN(value)) {
            setPicks((prevPicks) =>
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
          await axios.post(`${auth.apiBaseUrl}/api/update-pick-history`, {
            id: id,
            result: updatedResult
          });
        } catch (error) {
          console.error('Error updating result:', error);
        }
    };

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
                            <th>User</th>
                            <th>Bet</th>
                            <th>Result</th>
                            <th></th>
                        </tr>                    
                    </thead>
                    <tbody>
                        {picks
                            .sort((a, b) => new Date(a["createdAt"]) - new Date(b["createdAt"]))
                            .map((pick) => {
                                let text = pick["text"]
                                let user = pick["username"]
                                let result = pick["result"]
                                let createdAt = pick["createdAt"]
                                return (
                                    <tr key={pick["_id"]}>
                                        <td>{new Date(createdAt).toLocaleString()}</td>
                                        <td>{user}</td>
                                        <td>{text}</td>
                                        <td>{
                                            <React.Fragment>
                                                <Form.Control
                                                    type="number"
                                                    min="-1"
                                                    max="1"
                                                    step="1"
                                                    value={result}
                                                    onChange={(e) => handleResultChange(e, pick)}
                                                />
                                            </React.Fragment>
                                            }
                                        </td>
                                        <td>
                                            <Button onClick={()=>handleUpdateResult(pick["_id"], result)}>Update</Button>
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
}

export default CalculateScoring;