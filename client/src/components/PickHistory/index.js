import React, { useState, useEffect } from "react";
import { Container, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import { useAuth0 } from "@auth0/auth0-react";
import './style.css';
import { useLocation } from 'react-router-dom';
import StevenNotification from "../StevenNotification";
import { useNavigate } from "react-router-dom";

const PickHistory = () => {
    const SEASON = "2025"
    const [error, setError] = useState("");
    const [picks, setPicks] = useState([]);
    const { user } = useAuth0();
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const userParam = queryParams.get('user');
    const usernameDisplay = userParam ? userParam : user.name;
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const disputePick = (description) => {
        navigate('/reportissue', { state: { description: `I want to dispute: ${description}` } });
    };

    useEffect(() => {
        const fetchPickHistory = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-pick-history`, {
                    params: {
                        username: usernameDisplay,
                        season: SEASON
                    }
                });

                if (response.data != null) {
                    const sortedPicks = response.data.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    setPicks(sortedPicks);
                }
            } catch (error) {
                setError('Error fetching picks');
            }
        };

        fetchPickHistory();
    }, [usernameDisplay, apiBaseUrl]);

    const groupedByWeek = picks.reduce((acc, pick) => {
        const week = pick.week ?? "Unknown Week";
        if (!acc[week]) acc[week] = [];
        acc[week].push(pick);
        return acc;
    }, {});

    const sortedWeekKeys = Object.keys(groupedByWeek).sort((a, b) => Number(b) - Number(a));
    return (
        <Container>
            <Row>
                <StevenNotification
                    message={message}
                    setMessage={setMessage}
                />
            </Row>
            <br />
            <Row>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                <div style={{ paddingBottom: 20 }}>
                    <h3>Season Total: {picks.reduce((acc, item) => acc + item.result, 0)}</h3>
                </div>
                <Table responsive bordered>
                    <thead>
                        <tr>
                            <th>Pick</th>
                            <th>Result</th>
                            <th className="dispute-cell">Dispute</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {sortedWeekKeys.map(week => (
                            <React.Fragment key={week}>

                                <tr>
                                    <td colSpan="4" style={{ backgroundColor: "#eee", fontWeight: "bold" }}>
                                        Week {week} ({(() => {const sum = groupedByWeek[week].reduce((acc, item) => acc + item.result, 0);
                                                                return sum > 0 ? <span style={{ color: "green" }}>+{sum}</span> : <span style={{ color: "red" }}>{sum}</span>;
                                                             })()})
                                    </td>
                                </tr>
                                {groupedByWeek[week].map(item => (
                                    <tr className="ph-row" key={item._id}>
                                        <td className="ph2-cell">
                                            {item.result > 0 ? (
                                                <span style={{ color: "green" }}><b>{item.text}</b></span>
                                            ) : item.result < 0 ? (
                                                <span style={{ color: "red" }}><b>{item.text}</b></span>
                                            ) : (
                                                <b>{item.text}</b>
                                            )}
                                        </td>
                                        <td className="ph3-cell">
                                            {item.result > 0 ? (
                                                <span style={{ color: "green" }}><b>1</b></span>
                                            ) : item.result < 0 ? (
                                                <span style={{ color: "red" }}><b>-1</b></span>
                                            ) : (
                                                <b>0</b>
                                            )}
                                        </td>
                                        <td onClick={() => disputePick(item.text)} className="dispute-cell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f0ad4e', cursor: "pointer" }}>
                                            <h4><i className="bi bi-flag-fill"></i></h4>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </Table>
            </Row>
        </Container>
    );
}

export default PickHistory;
