import React, { useState, useEffect, useMemo } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TablePagination from "@mui/material/TablePagination";
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
    const [seasonFilter, setSeasonFilter] = useState("");
    const [weekFilter, setWeekFilter] = useState("");
    const [userFilter, setUserFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const options = { year: "numeric", month: "numeric", day: "numeric" };

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
        const seasonLower = seasonFilter.toLowerCase();
        setPage(0);
        return picks.filter(pick => {
            if (betLower && !pick.text.toLowerCase().includes(betLower)) return false;
            if (userLower && !pick.username.toLowerCase().includes(userLower)) return false;
            if (weekLower && !String(pick.week).toLowerCase().includes(weekLower)) return false;
            if (seasonLower && !String(pick.season).toLowerCase().includes(seasonLower)) return false;
            if (dateFilter && !new Date(pick.createdAt).toLocaleDateString(undefined, options).includes(dateFilter)) return false;
            return true;
        });
    }, [picks, betFilter, userFilter, weekFilter, seasonFilter, dateFilter]);

    const paginatedPicks = useMemo(() =>
        filteredPicks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filteredPicks, page, rowsPerPage]
    );

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
                                    Created At<br />
                                    <input type="text" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                                </StevenTableCell>
                                <StevenTableCell>
                                    Season<br />
                                    <input type="text" value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)} />
                                </StevenTableCell>
                                <StevenTableCell>
                                    Week<br />
                                    <input type="text" value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)} />
                                </StevenTableCell>
                                <StevenTableCell>
                                    User<br />
                                    <input type="text" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
                                </StevenTableCell>
                                <StevenTableCell>
                                    Bet<br />
                                    <input type="text" value={betFilter} onChange={(e) => setBetFilter(e.target.value)} />
                                </StevenTableCell>
                                <StevenTableCell>Result</StevenTableCell>
                                <StevenTableCell></StevenTableCell>
                            </StevenTableRow>
                        </StevenTableHead>
                        <StevenTableBody>
                            {paginatedPicks.map((pick) => (
                                <StevenTableRow key={pick["_id"]}>
                                    <StevenTableCell>{new Date(pick.createdAt).toLocaleDateString(undefined, options)}</StevenTableCell>
                                    <StevenTableCell>{pick.season}</StevenTableCell>
                                    <StevenTableCell>{pick.week}</StevenTableCell>
                                    <StevenTableCell>{pick.username.split("@")[0]}</StevenTableCell>
                                    <StevenTableCell>{pick.text}</StevenTableCell>
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
                            ))}
                        </StevenTableBody>
                    </StevenTable>
                </StevenTableContainer>
                <TablePagination
                    component="div"
                    count={filteredPicks.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                />
            </Box>
        </Container>
    );
};

export default CalculateScoring;