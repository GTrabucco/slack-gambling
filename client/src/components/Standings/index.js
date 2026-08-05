import { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import './style.css';
import { useNavigate } from "react-router-dom";
import userService from "../../services/userService";
import pickService from "../../services/pickService";
import StevenSelect from "../Common/StevenSelect";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../Common/StevenTable";

const tieSameRank = (a, b, season) =>
    a.resultSum === b.resultSum &&
    (parseInt(season) < 2026 || a.gotwWins === b.gotwWins) &&
    a.zeroWeeks === b.zeroWeeks &&
    a.perfectWeeksCount === b.perfectWeeksCount &&
    a.winningWeeks === b.winningWeeks;

const Standings = () => {
    const [error, setError] = useState("");
    const [data, setData] = useState([]);
    const [perfectWeeks, setPerfectWeeks] = useState({});
    const [negFourWeeks, setNegFourWeeks] = useState({});
    const [positiveWeeks, setPositiveWeeks] = useState({});
    const [users, setUsers] = useState({});
    const [seasons, setSeasons] = useState(["2025"]);
    const [selectedSeason, setSelectedSeason] = useState("2025");
    const [lastPlaceRank, setLastPlaceRank] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const maxSeason = seasons.reduce((a, b) => (parseInt(a) > parseInt(b) ? a : b), "2025");
        setSelectedSeason(maxSeason);
    }, [seasons]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await userService.getAllUsers();
                if (response.data != null) {
                    setUsers(Object.groupBy(response.data, ({ username }) => username));
                }
            } catch (error) {
                setError('Error fetching users');
            }
        };

        const fetchPickHistory = async () => {
            try {
                const response = await pickService.getPickHistory(null, selectedSeason);
                if (response.data != null) {
                    let picks = response.data;
                    const groupedByUser = Object.groupBy(picks, ({ username }) => username);
                    const newPerfectWeeks = {};
                    const newNegFourWeeks = {};
                    const newPositiveWeeks = {};
                    const newGotwWins = {};
                    const userTotals = {};
                    const userTimelapse = {};

                    Object.entries(groupedByUser).forEach(([username, userPicks]) => {
                        userTotals[username] = 0;
                        const picksByWeek = Object.groupBy(userPicks, ({ week }) => week);
                        const perfectScore = parseInt(selectedSeason) >= 2026 ? 5 : 4;
                        const worstScore = parseInt(selectedSeason) >= 2026 ? -5 : -4;
                        Object.values(picksByWeek).forEach(weeklyPicks => {
                            const resultSum = weeklyPicks.reduce((sum, pick) => sum + pick.result, 0);
                            userTotals[username] += resultSum;
                            userTimelapse[username] = userTimelapse[username] || [];
                            userTimelapse[username].push(resultSum);

                            if (resultSum === perfectScore) {
                                newPerfectWeeks[username] = (newPerfectWeeks[username] || 0) + 1;
                            } else if (resultSum === worstScore) {
                                newNegFourWeeks[username] = (newNegFourWeeks[username] || 0) + 1;
                            }

                            if (resultSum > 0) {
                                newPositiveWeeks[username] = (newPositiveWeeks[username] || 0) + 1;
                            }
                        });

                        userPicks.forEach(pick => {
                            if (pick.type === 'gotw' && (pick.result || 0) > 0) {
                                newGotwWins[username] = (newGotwWins[username] || 0) + 1;
                            }
                        });
                    });

                    let rank = 0;
                    const standings = Object.entries(userTotals)
                        .map(([username, resultSum]) => ({
                            username,
                            resultSum,
                            gotwWins: newGotwWins[username] || 0,
                            zeroWeeks: newNegFourWeeks[username] || 0,
                            perfectWeeksCount: newPerfectWeeks[username] || 0,
                            winningWeeks: newPositiveWeeks[username] || 0,
                        }))
                        .sort((a, b) => {
                            if (b.resultSum !== a.resultSum) return b.resultSum - a.resultSum;
                            if (parseInt(selectedSeason) >= 2026 && b.gotwWins !== a.gotwWins) return b.gotwWins - a.gotwWins;
                            if (a.zeroWeeks !== b.zeroWeeks) return a.zeroWeeks - b.zeroWeeks;
                            if (b.perfectWeeksCount !== a.perfectWeeksCount) return b.perfectWeeksCount - a.perfectWeeksCount;
                            return b.winningWeeks - a.winningWeeks;
                        })
                        .map((item, index, arr) => {
                            if (index === 0 || !tieSameRank(item, arr[index - 1], selectedSeason)) {
                                rank = index + 1;
                            }
                            return { ...item, rank };
                        });

                    const highestRank = Math.max(...standings.map(obj => obj.rank));
                    setLastPlaceRank(highestRank)
                    setData(standings);
                    setPerfectWeeks(newPerfectWeeks);
                    setNegFourWeeks(newNegFourWeeks);
                    setPositiveWeeks(newPositiveWeeks);
                }
            } catch (error) {
                console.log(error);
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
            <Box sx={{ mb: 2, pt: 2 }}>
                <FormControl size="small">
                    <FormLabel>Season</FormLabel>
                    <StevenSelect
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        options={seasons.map((season) => ({ value: season, label: season }))}
                    />
                </FormControl>
            </Box>
            {error && <Alert severity="danger" sx={{ mb: 2 }}>{error}</Alert>}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Tiebreaker rules: {parseInt(selectedSeason) >= 2026 ? "GOTW record → " : ""}Fewest 0/{parseInt(selectedSeason) >= 2026 ? 5 : 4} weeks → Most {parseInt(selectedSeason) >= 2026 ? 5 : 4}/{parseInt(selectedSeason) >= 2026 ? 5 : 4} weeks → Most &gt;0 weeks
            </Typography>
            <StevenTableContainer sx={{ overflowX: 'auto', overflowY: 'visible' }}>
                <StevenTable stickyHeader>
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }}></StevenTableCell>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }}>Name</StevenTableCell>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }}>Points</StevenTableCell>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }}>{parseInt(selectedSeason) >= 2026 ? "5/5 Weeks" : "4/4 Weeks"}</StevenTableCell>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }}>{parseInt(selectedSeason) >= 2026 ? "0/5 Weeks" : "0/4 Weeks"}</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                        {data
                            .sort((a, b) => b.resultSum - a.resultSum)
                            .map((item) => {
                                if (item.rank < 4) {
                                    return (
                                        <StevenTableRow key={item.username}>
                                            <StevenTableCell>
                                                {item.rank === 1 ? <img className="medal" src="GoldMedal.svg" alt="Gold medal" /> : ""}
                                                {item.rank === 2 ? <img className="medal" src="SilverMedal.svg" alt="Silver medal" /> : ""}
                                                {item.rank === 3 ? <img className="medal" src="BronzeMedal.svg" alt="Bronze medal" /> : ""}
                                            </StevenTableCell>
                                            <StevenTableCell>
                                                <MuiLink
                                                    component="button"
                                                    underline="hover"
                                                    onClick={() => navigate(`/pickhistory?user=${item.username}`)}
                                                    sx={{ cursor: "pointer" }}
                                                >
                                                    {users && users[item.username]?.[0]?.displayName || item.username.split("@")[0]}
                                                </MuiLink>
                                            </StevenTableCell>
                                            <StevenTableCell> {item.resultSum}</StevenTableCell>
                                            <StevenTableCell>{perfectWeeks[item.username]}</StevenTableCell>
                                            <StevenTableCell>{negFourWeeks[item.username]}</StevenTableCell>
                                        </StevenTableRow>
                                    );
                                }
                                return null;
                            })}
                        {data
                            .sort((a, b) => b.resultSum - a.resultSum)
                            .map((item) => {
                                if (item.rank > 3) {
                                    return (
                                        <StevenTableRow className="s-row" key={item.username}>
                                            <StevenTableCell className={getPlace(item.rank)}>
                                                {item.rank === lastPlaceRank ? <img className="medal" src="dumpsterfire.png" alt="Last place" /> : item.rank}
                                            </StevenTableCell>
                                            <StevenTableCell className="s1-cell">
                                                <MuiLink
                                                    component="button"
                                                    underline="hover"
                                                    onClick={() => navigate(`/pickhistory?user=${item.username}`)}
                                                    sx={{ cursor: "pointer" }}
                                                >
                                                    {users && users[item.username]?.[0]?.displayName || item.username.split("@")[0]}
                                                </MuiLink>
                                            </StevenTableCell>
                                            <StevenTableCell className="s2-cell"> {item.resultSum}</StevenTableCell>
                                            <StevenTableCell className="s2-cell">{perfectWeeks[item.username]}</StevenTableCell>
                                            <StevenTableCell className="s2-cell">{negFourWeeks[item.username]}</StevenTableCell>
                                        </StevenTableRow>
                                    );
                                }
                                return null;
                            })}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
        </Container>
    );
}

export default Standings;
