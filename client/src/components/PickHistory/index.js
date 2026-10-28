import React, { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Typography from "@mui/material/Typography";
import { useAuth0 } from "@auth0/auth0-react";
import './style.css';
import { useLocation } from 'react-router-dom';
import StevenNotification from "../StevenNotification";
import { useNavigate } from "react-router-dom";
import StevenButton from "../Common/StevenButton";
import pickService from "../../services/pickService";
import apiClient from "../../services/apiClient";
import userService from "../../services/userService";
import ResultIcon from "../Common/ResultIcon";
import { resultColors } from "../../theme";
import StevenSelect from "../Common/StevenSelect";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../Common/StevenTable";

const PickHistory = () => {
    const [error, setError] = useState("");
    const [picks, setPicks] = useState([]);
    const [seasonOptions, setSeasonOptions] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState("");
    const { user } = useAuth0();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const userParam = queryParams.get('user');
    const usernameDisplay = userParam ? userParam : user.name;
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const isOwnPage = !userParam || userParam === user.name;
    const [viewedDisplayName, setViewedDisplayName] = useState("");

    useEffect(() => {
        if (isOwnPage) return;
        setViewedDisplayName("");
        userService.getByUsername(userParam)
            .then(res => setViewedDisplayName(res.data?.[0]?.displayName || ""))
            .catch(() => { });
    }, [userParam, isOwnPage]);

    const viewedName = viewedDisplayName || (userParam || "").split("@")[0];

    const disputePick = (description) => {
        navigate('/reportissue', { state: { description: `I want to dispute: ${description}` } });
    };

    useEffect(() => {
        const fetchSeasonOptions = async () => {
            try {
                const res = await apiClient.get('/api/seasons');
                const seasons = res.data || [];
                setSeasonOptions(seasons);
                if (seasons.length > 0) setSelectedSeason(seasons[0]);
            } catch (_) { }
        };
        fetchSeasonOptions();
    }, []);

    useEffect(() => {
        const fetchPickHistory = async () => {
            if (!selectedSeason) return;
            try {
                const seasonFilter = selectedSeason === "All" ? null : selectedSeason;
                const response = await pickService.getPickHistory(usernameDisplay, seasonFilter);
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
    }, [usernameDisplay, selectedSeason]);

    const groupedByWeek = picks.reduce((acc, pick) => {
        const week = pick.week ?? "Unknown Week";
        if (!acc[week]) acc[week] = [];
        acc[week].push(pick);
        return acc;
    }, {});

    // Neutral color for pushes (0) so a break-even pick/week doesn't read as a loss.
    const resultColor = (result) =>
        result > 0 ? resultColors.win.text : result < 0 ? resultColors.loss.text : "inherit";

    const sortedWeekKeys = Object.keys(groupedByWeek).sort((a, b) => Number(b) - Number(a));
    return (
        <Container>
            <StevenNotification
                message={message}
                setMessage={setMessage}
            />
            <br />
            <Box sx={{ mb: 2 }}>
                {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
                <FormControl size="small">
                    <FormLabel>Season</FormLabel>
                    <StevenSelect
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        options={[
                            { value: "All", label: "All" },
                            ...seasonOptions.map((season) => ({ value: season, label: season }))
                        ]}
                    />
                </FormControl>
            </Box>
            <Box sx={{ pb: 2.5 }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                    {isOwnPage ? "My Pick History" : `${viewedName}'s Pick History`}
                </Typography>
                <Typography variant="h6">Score: {picks.reduce((acc, item) => acc + item.result, 0)}</Typography>
            </Box>
            <StevenTableContainer>
                <StevenTable>
                    <StevenTableBody>
                        {sortedWeekKeys.map(week => (
                            <React.Fragment key={week}>
                                <StevenTableRow>
                                    <StevenTableCell colSpan={isOwnPage ? 3 : 2} sx={{ backgroundColor: "rgba(255,255,255,0.08)", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                                        Week {week} ({(() => {
                                            const sum = groupedByWeek[week].reduce((acc, item) => acc + item.result, 0);
                                            return <span style={{ color: resultColor(Math.sign(sum)) }}>{sum > 0 ? `+${sum}` : sum}</span>;
                                        })()})
                                    </StevenTableCell>
                                </StevenTableRow>
                                {groupedByWeek[week].map(item => (
                                    <StevenTableRow className="ph-row" key={item._id}>
                                        <StevenTableCell className="ph2-cell" sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                                            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, color: resultColor(item.result) }}>
                                                <ResultIcon result={Math.sign(item.result)} />
                                                <b>{item.text}</b>
                                            </Box>
                                        </StevenTableCell>
                                        <StevenTableCell className="ph3-cell">
                                            <b style={{ color: resultColor(item.result) }}>
                                                {item.result > 0 ? "+1" : item.result < 0 ? "-1" : "0"}
                                            </b>
                                        </StevenTableCell>
                                        {isOwnPage && (
                                            <StevenTableCell>
                                                <StevenButton onClick={() => disputePick(`Week ${item.week}: ${item.text}`)}>
                                                    Dispute
                                                </StevenButton>
                                            </StevenTableCell>
                                        )}
                                    </StevenTableRow>
                                ))}
                            </React.Fragment>
                        ))}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
        </Container>
    );
}

export default PickHistory;
