import React, { useState, useEffect, useMemo } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StevenButton from "../../Common/StevenButton";
import pickService from "../../../services/pickService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../../Common/StevenTable";

const CalculateScoring = () => {
    const [picks, setPicks] = useState([]);
    const [editedResults, setEditedResults] = useState({});
    const [betFilter, setBetFilter] = useState("");
    const [weekFilter, setWeekFilter] = useState("");
    const [userFilter, setUserFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    };

    useEffect(() => {
        const fetchPickHistory = async () => {
            try {
                const response = await pickService.getPickHistory("All", null);
                if (response.data != null) {
                    const sortedPicks = response.data.sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    setPicks(sortedPicks);
                }
            } catch (error) {
                console.error('Error fetching picks:', error);
            }
        };

        fetchPickHistory();
    }, []);

    const filteredPicks = useMemo(() => {
        const betLower = betFilter.toLowerCase();
        const userLower = userFilter.toLowerCase();
        const weekLower = weekFilter.toLowerCase();
        return picks.filter(pick => {
            if (betLower && !pick.text.toLowerCase().includes(betLower)) return false;
            if (userLower && !pick.username.toLowerCase().includes(userLower)) return false;
            if (weekLower && !pick.week.toLowerCase().includes(weekLower)) return false;
            if (dateFilter && !new Date(pick.createdAt).toLocaleDateString(undefined, options).includes(dateFilter)) return false;
            return true;
        });
    }, [picks, betFilter, userFilter, weekFilter, dateFilter]);

    const getResult = (pick) =>
        editedResults[pick._id] !== undefined ? editedResults[pick._id] : pick.result;

    const handleResultChange = (event, pick) => {
        const value = event.target.value;
        if (!isNaN(value)) {
            setEditedResults(prev => ({ ...prev, [pick._id]: value }));
        }
    };

    const handleUpdateResult = async (id, pick) => {
        const result = getResult(pick);
        try {
            await pickService.updatePickHistory(id, result);
        } catch (error) {
            console.error('Error updating result:', error);
        }
    };

    return (
        <Container>
            <Typography variant="h5" sx={{ mb: 2 }}>Calculate Scoring</Typography>
            <Box>
                <StevenTableContainer>
                    <StevenTable>
                        <StevenTableHead>
                            <StevenTableRow>
                                <StevenTableCell>
                                    Created At
                                    <br />
                                    <input
                                        type="text"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                    />
                                </StevenTableCell>
                                <StevenTableCell>
                                    Week
                                    <br />
                                    <input
                                        type="text"
                                        value={weekFilter}
                                        onChange={(e) => setWeekFilter(e.target.value)}
                                    />
                                </StevenTableCell>
                                <StevenTableCell>
                                    User
                                    <br />
                                    <input
                                        type="text"
                                        value={userFilter}
                                        onChange={(e) => setUserFilter(e.target.value)}
                                    />
                                </StevenTableCell>
                                <StevenTableCell>
                                    Bet
                                    <br />
                                    <input
                                        type="text"
                                        value={betFilter}
                                        onChange={(e) => setBetFilter(e.target.value)}
                                    />
                                </StevenTableCell>
                                <StevenTableCell>Result</StevenTableCell>
                                <StevenTableCell></StevenTableCell>
                            </StevenTableRow>
                        </StevenTableHead>
                        <StevenTableBody>
                        {filteredPicks
                            .map((pick) => {
                                let text = pick["text"];
                                let user = pick["username"];
                                let result = pick["result"];
                                let week = pick["week"];
                                let createdAt = pick["createdAt"];
                                return (
                                    <StevenTableRow key={pick["_id"]}>
                                        <StevenTableCell>{new Date(createdAt).toLocaleDateString(undefined, options)}</StevenTableCell>
                                        <StevenTableCell>{week}</StevenTableCell>
                                        <StevenTableCell>{user.split("@")[0]}</StevenTableCell>
                                        <StevenTableCell>{text}</StevenTableCell>
                                        <StevenTableCell>
                                            <input
                                                type="number"
                                                min={-1}
                                                max={1}
                                                step={1}
                                                value={getResult(pick)}
                                                onChange={(e) => handleResultChange(e, pick)}
                                                style={{ width: 60 }}
                                            />
                                        </StevenTableCell>
                                        <StevenTableCell className="cs5-cell">
                                            <StevenButton onClick={() => handleUpdateResult(pick["_id"], pick)}>
                                                Update
                                            </StevenButton>
                                        </StevenTableCell>
                                    </StevenTableRow>
                                );
                            }
                        )}
                        </StevenTableBody>
                    </StevenTable>
                </StevenTableContainer>
            </Box>
        </Container>
    );
};

export default CalculateScoring;
