import React, { useState, useEffect } from "react";
import { Container, Row, Table, Nav, Button } from 'react-bootstrap';
import axios from 'axios'
import { useAuth0 } from "@auth0/auth0-react";
import './style.css'
import { useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

const PickHistory = (props) => {
    const [error, setError] = useState("");
    const [picks, setPicks] = useState([])
    const { user } = useAuth0();
    const navigate = useNavigate();
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const userParam = queryParams.get('user');
    const usernameDisplay = userParam ? userParam : user.name
    const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    };
      
    useEffect(() => {
        const fetchPickHistory = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-pick-history`, {
                    params: {
                        username: usernameDisplay
                    }
                });

                if (response.data != null) {
                    const sortedPicks = response.data.sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );

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
                <Table responsive bordered hover>
                    <thead>
                        <tr>
                            <th>Submitted</th>
                            <th>Pick</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {picks.map((item) => (
                            <tr className="ph-row" key={item._id}>
                                <td className="ph1-cell"><b>{new Date(item.createdAt).toLocaleDateString(undefined, options)}</b></td>
                                <td className="ph2-cell">{item.result > 0 ? <span style={{"color": "green"}}><b>{item.text}</b></span> : 
                                                          item.result < 0 ? <span style={{"color": "red"}}><b>{item.text}</b></span> :
                                                          <b>{item.text}</b>}</td>
                                <td className="ph3-cell">{item.result > 0 ? <span style={{"color": "green"}}><b>1</b></span> : 
                                                          item.result < 0 ? <span style={{"color": "red"}}><b>-1</b></span> :
                                                          <b>0</b>}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Row>
        </Container>
    );
}

export default PickHistory;