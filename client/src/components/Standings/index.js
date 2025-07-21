import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Nav } from 'react-bootstrap';
import axios from 'axios'
import './style.css'
import { useNavigate } from "react-router-dom";

const Standings = () => {
    const [error, setError] = useState("");
    const [data, setData] = useState([]);
    const [perfectWeeks, setPerfectWeeks] = useState([])
    const [negFourWeeks, setNegFourWeeks] = useState([])
    const [users, setUsers] = useState([])
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
    const navigate = useNavigate();
    const SEASON = "2024";

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

        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-users`);
                if (response.data != null) {
                    console.log(Object.groupBy(response.data, ({username}) => username))
                    setUsers(Object.groupBy(response.data, ({username}) => username));
                }
            } catch (error) {
                setError('Error fetching users');
            }
        };

        const fetchPickHistory = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-pick-history`, {
                    params: {
                        username: null
                    }
                });

                if (response.data != null) {
                    let picks = response.data;
                    const groupedBySeason = Object.groupBy(picks, ({ season }) => season);
                    const seasonPicks = groupedBySeason[SEASON];
                    const groupedByUser = Object.groupBy(seasonPicks, ({ username }) => username);
                    const newPerfectWeeks = {};
                    const newNegFourWeeks = {};
                    Object.entries(groupedByUser).forEach(([username, userPicks]) => {
                        const picksByWeek = Object.groupBy(userPicks, ({ week }) => week);
                        Object.values(picksByWeek).forEach(weeklyPicks => {
                            const resultSum = weeklyPicks.reduce((sum, pick) => sum + pick.result, 0);
                            if (resultSum === 4) {
                                newPerfectWeeks[username] = (newPerfectWeeks[username] || 0) + 1;
                            } else if (resultSum === -4) {
                                newNegFourWeeks[username] = (newNegFourWeeks[username] || 0) + 1;
                            }
                        });
                    });

                    setPerfectWeeks(newPerfectWeeks);
                    setNegFourWeeks(newNegFourWeeks);
                }
            } catch (error) {
                setError('Error fetching picks');
            }
        };
        fetchUsers();
        fetchStandings();
        fetchPickHistory();
    }, [])

    const getPlace = (index) => {
        switch (index) {
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
            <Table responsive bordered hover>
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Points</th>
                        <th>Perfect Weeks</th>
                        <th>-4 Weeks</th>
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
                                    <tr key={item.username}>
                                        <td className={getPlace(rank)}>
                                            {rank < 4 ? <b>{rank}</b> : rank}
                                        </td>
                                        <td>
                                            <Nav.Link
                                                onClick={() => navigate(`/pickhistory?user=${item.username}`)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                {users && users[item.username]?.[0]?.displayName || item.username.split("@")[0]}
                                            </Nav.Link>
                                        </td>
                                        <td> {item.resultSum}</td>
                                        <td>{perfectWeeks[item.username]}</td>
                                        <td>{negFourWeeks[item.username]}</td>
                                    </tr>
                                );
                            }
                        })}
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
                                                {users && users[item.username]?.[0]?.displayName || item.username.split("@")[0]}
                                            </Nav.Link>
                                        </td>
                                        <td className="s2-cell"> {item.resultSum}</td>
                                        <td className="s2-cell">{perfectWeeks[item.username]}</td>
                                        <td className="s2-cell">{negFourWeeks[item.username]}</td>
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