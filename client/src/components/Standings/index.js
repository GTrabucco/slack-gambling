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

    const getPlace = (index) => {
        switch(index) {
            case 1:
                return "first"
            case 2:
                return "second"
            case 3:
                return "third"
            default:
                return "";
        }
    };

    return (
        <Container>
            <Row>
                <h2>Standings</h2>
            </Row>
            {error && <div className="alert alert-danger">{error}</div>}
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
                {data
                    .sort((a, b) => b.resultSum - a.resultSum) 
                    .map((item, index, arr) => {
                        const rank = index > 0 && arr[index - 1].resultSum === item.resultSum 
                            ? arr[index - 1].rank 
                            : index + 1;

                        item.rank = rank;
                        if (rank < 4) {
                            return (
                                <tr className="s-row" key={item.username}>
                                    <td className={getPlace(rank)}>
                                        {rank < 4 ? <b>{rank}</b> : rank}                                  
                                    </td>
                                    <td className="s1-cell">
                                        <Nav.Link
                                            onClick={() => navigate(`/pickhistory?user=${item.username}`)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {item.username}
                                        </Nav.Link>
                                    </td>
                                    <td className="s2-cell"> {item.resultSum}</td>
                                </tr>
                            );
                        }     
                    })}
                </tbody>
            </Table>

            <Table striped bordered hover>
                <tbody>
                {data
                    .sort((a, b) => b.resultSum - a.resultSum) 
                    .map((item, index, arr) => {
                        const rank = index > 0 && arr[index - 1].resultSum === item.resultSum 
                            ? arr[index - 1].rank 
                            : index + 1;

                        item.rank = rank;
                        if (rank > 3) {
                            return (
                                <tr className="s-row" key={item.username}>
                                    <td className={getPlace(rank)}>
                                        {rank < 4 ? <b>{rank}</b> : rank}                                  
                                    </td>
                                    <td className="s1-cell">
                                        <Nav.Link
                                            onClick={() => navigate(`/pickhistory?user=${item.username}`)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {item.username}
                                        </Nav.Link>
                                    </td>
                                    <td className="s2-cell"> {item.resultSum}</td>
                                </tr>
                            );
                        }     
                    })}
                </tbody>
            </Table>
        </Container>
    );
}

export default Standings;