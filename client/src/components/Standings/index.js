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
import { useAuth0 } from "@auth0/auth0-react";
import { colors } from "../../theme";
import userService from "../../services/userService";
import pickService from "../../services/pickService";
import apiClient from "../../services/apiClient";
import StevenSelect from "../Common/StevenSelect";
import DonorBadge from "../Common/DonorBadge";
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

const formatClv = (value, digits) => {
    if (value == null) return "–";
    const fixed = value.toFixed(digits);
    return value > 0 ? `+${fixed}` : fixed;
};

const clvColor = (value) => {
    if (value == null || value === 0) return undefined;
    return value > 0 ? "success.main" : "error.main";
};

// Pin the Name column while the table scrolls sideways (mostly for mobile). Sticky cells
// need an opaque background, so they sit on the paper color and re-apply the row's tint
// (striping, hover, current user) as a gradient layer on top.
const rowTint = (color) => ({ backgroundImage: `linear-gradient(${color}, ${color})` });
const stickyNameSx = {
    "& .sticky-name": {
        position: "sticky",
        left: 0,
        zIndex: 2,
        backgroundColor: "background.paper",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.08)",
    },
    "& thead .sticky-name": { zIndex: 3 },
    "& tbody tr:nth-of-type(odd) .sticky-name": rowTint("rgba(255,255,255,0.02)"),
    "& tbody tr:hover .sticky-name": rowTint("rgba(255,255,255,0.05)"),
    "& tbody tr[aria-current='true'] .sticky-name": rowTint("rgba(144, 202, 249, 0.12)"),
};

const Standings = () => {
    const [error, setError] = useState("");
    const [data, setData] = useState([]);
    const [perfectWeeks, setPerfectWeeks] = useState({});
    const [negFourWeeks, setNegFourWeeks] = useState({});
    const [positiveWeeks, setPositiveWeeks] = useState({});
    const [users, setUsers] = useState({});
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState("");
    const [lastPlaceRank, setLastPlaceRank] = useState(null);
    const [clv, setClv] = useState({});
    const navigate = useNavigate();
    const { user } = useAuth0();

    useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const res = await apiClient.get('/api/seasons');
                const data = res.data || [];
                setSeasons(data);
                if (data.length > 0) {
                    setSelectedSeason(data[0]);
                }
            } catch (_) { }
        };
        fetchSeasons();
    }, []);

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
            if (!selectedSeason) return;
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

        const fetchClv = async () => {
            if (!selectedSeason) return;
            try {
                const res = await apiClient.get('/api/clv-summary', { params: { season: selectedSeason } });
                setClv(res.data || {});
            } catch (_) {
                setClv({});
            }
        };

        fetchUsers();
        fetchPickHistory();
        fetchClv();
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

    const hasGotw = parseInt(selectedSeason) >= 2026;
    const perfectScore = hasGotw ? 5 : 4;

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
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Tiebreaker rules: {hasGotw ? "GOTW wins → " : ""}Fewest 0/{perfectScore} weeks → Most {perfectScore}/{perfectScore} weeks → Most &gt;0 weeks
            </Typography>
            <StevenTableContainer sx={{ overflowX: 'auto', overflowY: 'visible', ...stickyNameSx }}>
                <StevenTable stickyHeader>
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }}></StevenTableCell>
                            <StevenTableCell className="sticky-name" sx={{ bgcolor: "background.paper", zIndex: 3 }}>Name</StevenTableCell>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }}>Points</StevenTableCell>
                            {hasGotw && <StevenTableCell sx={{ bgcolor: "background.paper" }}>GOTW Wins</StevenTableCell>}
                            <StevenTableCell sx={{ bgcolor: "background.paper" }}>{perfectScore}/{perfectScore} Weeks</StevenTableCell>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }}>0/{perfectScore} Weeks</StevenTableCell>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }} title="Total closing line value (points) across all spread/total picks this season">Total CLV</StevenTableCell>
                            <StevenTableCell sx={{ bgcolor: "background.paper" }} title="Average closing line value per pick (points)">Avg CLV</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                        {data.map((item) => {
                            const isMe = item.username === user?.name;
                            const details = users?.[item.username]?.[0];
                            return (
                                <StevenTableRow
                                    key={item.username}
                                    className={item.rank > 3 ? "s-row" : undefined}
                                    aria-current={isMe ? "true" : undefined}
                                    sx={isMe ? {
                                        "&.MuiTableRow-root": { backgroundColor: "rgba(144, 202, 249, 0.12) !important" },
                                        "& td:first-of-type": { boxShadow: `inset 3px 0 0 ${colors.primary}` },
                                        "& td": { fontWeight: 700 },
                                    } : undefined}
                                >
                                    <StevenTableCell className={getPlace(item.rank)}>
                                        {item.rank === 1 ? <img className="medal" src="GoldMedal.svg" alt="Gold medal" />
                                            : item.rank === 2 ? <img className="medal" src="SilverMedal.svg" alt="Silver medal" />
                                                : item.rank === 3 ? <img className="medal" src="BronzeMedal.svg" alt="Bronze medal" />
                                                    : item.rank === lastPlaceRank ? <img className="medal" src="dumpsterfire.png" alt="Last place" />
                                                        : item.rank}
                                    </StevenTableCell>
                                    <StevenTableCell className={item.rank > 3 ? "s1-cell sticky-name" : "sticky-name"}>
                                        <MuiLink
                                            component="button"
                                            underline="hover"
                                            onClick={() => navigate(`/pickhistory?user=${item.username}`)}
                                            sx={{ cursor: "pointer", fontWeight: "inherit" }}
                                        >
                                            {details?.displayName || item.username.split("@")[0]}
                                        </MuiLink>
                                        {details?.donationAmount > 0 && <DonorBadge amount={details.donationAmount} sx={{ ml: 0.5 }} />}
                                        {isMe && <Typography component="span" sx={{ ml: 0.75, fontSize: 11, color: colors.primary }}></Typography>}
                                    </StevenTableCell>
                                    <StevenTableCell className={item.rank > 3 ? "s2-cell" : undefined}>{item.resultSum}</StevenTableCell>
                                    {hasGotw && <StevenTableCell className={item.rank > 3 ? "s2-cell" : undefined}>{item.gotwWins}</StevenTableCell>}
                                    <StevenTableCell className={item.rank > 3 ? "s2-cell" : undefined}>{perfectWeeks[item.username]}</StevenTableCell>
                                    <StevenTableCell className={item.rank > 3 ? "s2-cell" : undefined}>{negFourWeeks[item.username]}</StevenTableCell>
                                    <StevenTableCell className={item.rank > 3 ? "s2-cell" : undefined} sx={{ color: clvColor(clv[item.username]?.total) }}>
                                        {formatClv(clv[item.username]?.total, 1)}
                                    </StevenTableCell>
                                    <StevenTableCell className={item.rank > 3 ? "s2-cell" : undefined} sx={{ color: clvColor(clv[item.username]?.average) }}>
                                        {formatClv(clv[item.username]?.average, 2)}
                                    </StevenTableCell>
                                </StevenTableRow>
                            );
                        })}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
        </Container>
    );
}

export default Standings;
