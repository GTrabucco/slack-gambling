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
import StevenSelect from "../Common/StevenSelect";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../Common/StevenTable";

const PickHistory = () => {
    const DEFAULT_SEASON = "2025";
    const [error, setError] = useState("");
    const [picks, setPicks] = useState([]);
    const [seasonOptions, setSeasonOptions] = useState([DEFAULT_SEASON]);
    const [selectedSeason, setSelectedSeason] = useState(DEFAULT_SEASON);
    const { user } = useAuth0();
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
        const fetchSeasonOptions = async () => {
            try {
                const response = await pickService.getPickHistory(usernameDisplay, null);
                const seasons = Array.from(
                    new Set(
                        (response.data || [])
                            .map((pick) => pick.season)
                            .filter(Boolean)
                            .map(String)
                    )
                ).sort((a, b) => Number(b) - Number(a));

                if (seasons.length > 0) {
                    setSeasonOptions(seasons);
                    setSelectedSeason((currentSeason) =>
                        seasons.includes(currentSeason) ? currentSeason : seasons[0]
                    );
                } else {
                    setSeasonOptions([DEFAULT_SEASON]);
                    setSelectedSeason(DEFAULT_SEASON);
                }
            } catch (seasonError) {
                console.error('Error fetching seasons:', seasonError);
            }
        };

        fetchSeasonOptions();
    }, [usernameDisplay]);

    useEffect(() => {
        const fetchPickHistory = async () => {
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
                <Typography variant="h6">Season Total: {picks.reduce((acc, item) => acc + item.result, 0)}</Typography>
            </Box>
            <StevenTableContainer>
                <StevenTable>
                    <StevenTableBody>
                    {sortedWeekKeys.map(week => (
                        <React.Fragment key={week}>
                            <StevenTableRow>
                                <StevenTableCell colSpan={4} sx={{ backgroundColor: "#eee", fontWeight: "bold", color: "black" }}>
                                    Week {week} ({(() => {const sum = groupedByWeek[week].reduce((acc, item) => acc + item.result, 0);
                                                            return sum > 0 ? <span style={{ color: "green" }}>+{sum}</span> : <span style={{ color: "red" }}>{sum}</span>;
                                                         })()})
                                </StevenTableCell>
                            </StevenTableRow>
                            {groupedByWeek[week].map(item => (
                                <StevenTableRow className="ph-row" key={item._id}>
                                    <StevenTableCell className="ph2-cell">
                                        {item.result > 0 ? (
                                            <span style={{ color: "green" }}><b>{item.text}</b></span>
                                        ) : item.result < 0 ? (
                                            <span style={{ color: "red" }}><b>{item.text}</b></span>
                                        ) : (
                                            <b>{item.text}</b>
                                        )}
                                    </StevenTableCell>
                                    <StevenTableCell className="ph3-cell">
                                        {item.result > 0 ? (
                                            <span style={{ color: "green" }}><b>1</b></span>
                                        ) : item.result < 0 ? (
                                            <span style={{ color: "red" }}><b>-1</b></span>
                                        ) : (
                                            <b>0</b>
                                        )}
                                    </StevenTableCell>
                                    <StevenTableCell>
                                        <StevenButton onClick={() => disputePick(`Week ${item.week}: ${item.text}`)}>
                                            Dispute
                                        </StevenButton>
                                    </StevenTableCell>
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
