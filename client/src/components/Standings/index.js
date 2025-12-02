import { useState, useEffect } from "react";
import { Container, Row, Table, Nav, Form } from "react-bootstrap";
import axios from "axios";
import './style.css';
import { useNavigate } from "react-router-dom";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { StevenTabPanel } from "../Common/StevenTabPanel";
import { Line, LineChart } from 'recharts';

const Standings = () => {
    const [error, setError] = useState("");
    const [data, setData] = useState([]);
    const [perfectWeeks, setPerfectWeeks] = useState({});
    const [negFourWeeks, setNegFourWeeks] = useState({});
    const [users, setUsers] = useState({});
    const [seasons, setSeasons] = useState(["2025"]);
    const [selectedSeason, setSelectedSeason] = useState("2025");
    const [lastPlaceRank, setLastPlaceRank] = useState(null);
    const [teamGraph, setTeamGraph] = useState({})
    const [tabValue, setTabValue] = useState(0);
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
                    const userTimelapse = {};

                    Object.entries(groupedByUser).forEach(([username, userPicks]) => {
                        userTotals[username] = 0;
                        const picksByWeek = Object.groupBy(userPicks, ({ week }) => week);
                        Object.values(picksByWeek).forEach(weeklyPicks => {
                            const resultSum = weeklyPicks.reduce((sum, pick) => sum + pick.result, 0);
                            userTotals[username] += resultSum;
                            userTimelapse[username] = userTimelapse[username] || [];
                            userTimelapse[username].push(resultSum);

                            if (resultSum === 4) {
                                newPerfectWeeks[username] = (newPerfectWeeks[username] || 0) + 1;
                            } else if (resultSum === -4) {
                                newNegFourWeeks[username] = (newNegFourWeeks[username] || 0) + 1;
                            }
                        });
                    });

                    let prevResultSum = null;
                    let prevRank = 0;
                    const standings = Object.entries(userTotals)
                        .map(([username, resultSum]) => ({ username, resultSum }))
                        .sort((a, b) => b.resultSum - a.resultSum)
                        .map((item, index, arr) => {
                            let rank;
                            if (item.resultSum === prevResultSum) {
                                rank = prevRank;
                            } else {
                                rank = index + 1;
                                prevResultSum = item.resultSum;
                                prevRank = rank;
                            }

                            return { ...item, rank };
                        });

                    const highestRank = Math.max(...standings.map(obj => obj.rank));
                    setLastPlaceRank(highestRank)
                    setData(standings);
                    setPerfectWeeks(newPerfectWeeks);
                    setNegFourWeeks(newNegFourWeeks);

                    const users = Object.keys(userTimelapse);
                    const numWeeks = Math.max(...users.map(u => userTimelapse[u].length));

                    const chartData = [];
                    for (let i = 0; i < numWeeks; i++) {
                        const weekData = { };
                        users.forEach(user => {
                            const cumulative = userTimelapse[user].slice(0, i + 1).reduce((sum, score) => sum + score, 0);
                            weekData[user] = cumulative;
                        });
                        chartData.push(weekData);
                    }

                    setTeamGraph(chartData);

                    console.log(chartData)
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

    function a11yProps(index) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Container>
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
            <Row>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Standings" {...a11yProps(0)} />
                    <Tab label="Historical Timeline" {...a11yProps(1)} />
                </Tabs>
            </Row>
            {error && <div className="alert alert-danger">{error}</div>}
            <StevenTabPanel value={tabValue} index={0}>
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
                            .map((item) => {
                                if (item.rank < 4) {
                                    return (
                                        <tr key={item.username}>
                                            <td>
                                                {item.rank === 1 ? <img className="medal" src="GoldMedal.svg" /> : ""}
                                                {item.rank === 2 ? <img className="medal" src="SilverMedal.svg" /> : ""}
                                                {item.rank === 3 ? <img className="medal" src="BronzeMedal.svg" /> : ""}
                                            </td>
                                            <td>
                                                <Nav.Link
                                                    className="clickable"
                                                    onClick={() => navigate(`/pickhistory?user=${item.username}`)}
                                                    style={{ cursor: "pointer", color: "blue" }}
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
                            .map((item) => {
                                if (item.rank > 3) {
                                    return (
                                        <tr className="s-row" key={item.username}>
                                            <td className={getPlace(item.rank)}>
                                                {item.rank === lastPlaceRank ? <img className="medal" src="dumpsterfire.png" /> : item.rank}
                                            </td>
                                            <td className="s1-cell">
                                                <Nav.Link
                                                    className="clickable"
                                                    onClick={() => navigate(`/pickhistory?user=${item.username}`)}
                                                    style={{ cursor: "pointer", color: "blue" }}
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
            </StevenTabPanel>
            <StevenTabPanel value={tabValue} index={1}>
                {teamGraph && teamGraph.length > 0 ? (
                    <LineChart width={800} height={400} data={teamGraph}>
                        {Object.keys(users).map((username, index) => (
                        <Line
                            key={username}
                            type="monotone"
                            dataKey={username}
                            stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                        />
                        ))}
                    </LineChart>
                ) : null}
            </StevenTabPanel>
        </Container>
    );
}

export default Standings;