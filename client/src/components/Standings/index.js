import { useState, useEffect } from "react";
import { Container, Row, Table, Nav, Form } from "react-bootstrap";
import axios from "axios";
import './style.css';
import { useNavigate } from "react-router-dom";

const Standings = () => {
    const [error, setError] = useState("");
    const [data, setData] = useState([]);
    const [perfectWeeks, setPerfectWeeks] = useState({});
    const [negFourWeeks, setNegFourWeeks] = useState({});
    const [users, setUsers] = useState({});
    const [seasons, setSeasons] = useState(["2025"]);
    const [selectedSeason, setSelectedSeason] = useState("2025");

    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
    const navigate = useNavigate();

    useEffect(() => {
        const maxSeason = seasons.reduce((a, b) => (parseInt(a) > parseInt(b) ? a : b), "2025");
        setSelectedSeason(maxSeason);
    }, [seasons]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-users`);
                if (response.data != null) {
                    setUsers(Object.groupBy(response.data, ({ username }) => username));
                }
            } catch (error) {
                setError('Error fetching users');
            }
        };

        const fetchPickHistory = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/get-pick-history`, {
                    params: { season: selectedSeason }
                });

                if (response.data != null) {
                    let picks = response.data;
                    const groupedByUser = Object.groupBy(picks, ({ username }) => username);
                    const newPerfectWeeks = {};
                    const newNegFourWeeks = {};
                    const userTotals = {};

                    Object.entries(groupedByUser).forEach(([username, userPicks]) => {
                        userTotals[username] = 0;

                        const picksByWeek = Object.groupBy(userPicks, ({ week }) => week);
                        Object.values(picksByWeek).forEach(weeklyPicks => {
                            const resultSum = weeklyPicks.reduce((sum, pick) => sum + pick.result, 0);
                            userTotals[username] += resultSum;

                            if (resultSum === 4) {
                                newPerfectWeeks[username] = (newPerfectWeeks[username] || 0) + 1;
                            } else if (resultSum === -4) {
                                newNegFourWeeks[username] = (newNegFourWeeks[username] || 0) + 1;
                            }
                        });
                    });

                    const standings = Object.entries(userTotals)
                        .map(([username, resultSum]) => ({ username, resultSum }))
                        .sort((a, b) => b.resultSum - a.resultSum);

                    setData(standings);
                    setPerfectWeeks(newPerfectWeeks);
                    setNegFourWeeks(newNegFourWeeks);
                }
            } catch (error) {
                setError('Error fetching picks');
            }
        };

        fetchUsers();
        fetchPickHistory();
    }, [selectedSeason]); 


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
            <Row className="mb-3">
                <Form.Group controlId="seasonSelect">
                    <Form.Label>Season</Form.Label>
                    <Form.Select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                    >
                        {seasons.map(season => (
                            <option key={season} value={season}>{season}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </Row>
            {error && <div className="alert alert-danger">{error}</div>}
            <Table responsive bordered>
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Points</th>
                        <th>4/4 Weeks</th>
                        <th>0/4 Weeks</th>
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
                                        <td>
                                            {rank === 1 ? <img className="medal" src="GoldMedal.svg" /> : ""}
                                            {rank === 2 ? <img className="medal" src="SilverMedal.svg" /> : ""}
                                            {rank === 3 ? <img className="medal" src="BronzeMedal.svg" /> : ""}
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