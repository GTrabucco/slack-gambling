import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import TablePagination from "@mui/material/TablePagination";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import StevenButton from "../../Common/StevenButton";
import { BsTrash } from "react-icons/bs";
import pickService from "../../../services/pickService";
import apiClient from "../../../services/apiClient";
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
    const [seasons, setSeasons] = useState([]);
    const [betFilter, setBetFilter] = useState("");
    const [seasonFilter, setSeasonFilter] = useState("");
    const [weekFilter, setWeekFilter] = useState("");
    const [userFilter, setUserFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [users, setUsers] = useState([]);
    const EMPTY_FORM = { username: "", gameId: "", homeTeam: "", awayTeam: "", type: "", value: "", text: "", season: "", week: "", result: "" };
    const [form, setForm] = useState(EMPTY_FORM);
    const PICK_TYPES = ["favorite", "dog", "over", "under", "gotw"];
    const options = { year: "numeric", month: "numeric", day: "numeric" };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [picksRes, seasonsRes, usersRes] = await Promise.all([
                    pickService.getPickHistory("All", null),
                    apiClient.get("/api/seasons"),
                    apiClient.get("/api/get-users"),
                ]);
                if (picksRes.data) {
                    setPicks(picksRes.data.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    ));
                }
                setSeasons(seasonsRes.data || []);
                setUsers(usersRes.data || []);
            } catch (e) {
                console.error("Error fetching picks:", e);
            }
        };
        fetchData();
    }, []);

    const refreshPicks = async () => {
        try {
            const picksRes = await pickService.getPickHistory("All", null);
            if (picksRes.data) setPicks(picksRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (e) {
            console.error("Error refreshing picks:", e);
        }
    };

    const filteredPicks = useMemo(() => {
        setPage(0);
        return picks.filter(pick => {
            if (betFilter && !pick.text?.toLowerCase().includes(betFilter.toLowerCase())) return false;
            if (userFilter && !pick.username?.toLowerCase().includes(userFilter.toLowerCase())) return false;
            if (weekFilter && !String(pick.week).toLowerCase().includes(weekFilter.toLowerCase())) return false;
            if (seasonFilter && !String(pick.season).toLowerCase().includes(seasonFilter.toLowerCase())) return false;
            if (dateFilter && !new Date(pick.createdAt).toLocaleDateString(undefined, options).includes(dateFilter)) return false;
            return true;
        });
    }, [picks, betFilter, userFilter, weekFilter, seasonFilter, dateFilter]);

    const paginatedPicks = useMemo(() =>
        filteredPicks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filteredPicks, page, rowsPerPage]
    );

    const handleResultChange = async (pick, newResult) => {
        try {
            await pickService.updatePickHistory(pick._id, newResult, undefined);
            setPicks(prev => prev.map(p => p._id === pick._id ? { ...p, result: newResult === "" ? null : Number(newResult) } : p));
            setSuccess(`Result updated for ${pick.text}`);
        } catch (e) {
            setError("Error updating result");
        }
    };

    const handleSeasonChange = async (pick, newSeason) => {
        try {
            await pickService.updatePickHistory(pick._id, undefined, newSeason);
            setPicks(prev => prev.map(p => p._id === pick._id ? { ...p, season: newSeason } : p));
            setSuccess(`Season updated for ${pick.text}`);
        } catch (e) {
            setError("Error updating season");
        }
    };

    const resultColor = (result) => {
        if (result === 1) return "#a5d6a7";
        if (result === -1) return "#ef9a9a";
        if (result === 0) return "#ffe082";
        return "text.secondary";
    };

    const handleCreate = async () => {
        if (!form.username || !form.type || !form.text) {
            setError("Username, type, and text are required");
            return;
        }
        try {
            const res = await apiClient.post("/api/admin/picks-history", form);
            setSuccess("Pick history record created");
            setForm(EMPTY_FORM);
            await refreshPicks();
        } catch (e) {
            setError("Error creating record");
        }
    };

    const handleDelete = async (pick) => {
        if (!window.confirm(`Delete "${pick.text}"?`)) return;
        try {
            await apiClient.delete(`/api/picks-history/${pick._id}`);
            await refreshPicks();
            setSuccess("Pick deleted");
        } catch (e) {
            setError("Error deleting pick");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Delete ${selectedIds.size} selected pick(s)?`)) return;
        try {
            await apiClient.delete("/api/picks-history", { data: { ids: Array.from(selectedIds) } });
            setSelectedIds(new Set());
            await refreshPicks();
            setSuccess(`Deleted ${selectedIds.size} pick(s)`);
        } catch (e) {
            setError("Error bulk deleting picks");
        }
    };

    const toggleSelectAll = () => {
        if (paginatedPicks.every(p => selectedIds.has(p._id))) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                paginatedPicks.forEach(p => next.delete(p._id));
                return next;
            });
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev);
                paginatedPicks.forEach(p => next.add(p._id));
                return next;
            });
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Calculate Scoring</Typography>

            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {/* Create Form */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Create Pick History Record</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Username</InputLabel>
                        <Select label="Username" value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}>
                            {users.map(u => <MenuItem key={u.username} value={u.username}>{u.username.split("@")[0]}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} md={1}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select label="Type" value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                            {PICK_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} md={3}>
                    <TextField label="Text" value={form.text} onChange={(e) => setForm(f => ({ ...f, text: e.target.value }))} fullWidth size="small" />
                </Grid>
                <Grid item xs={4} md={1}>
                    <TextField label="Value" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} fullWidth size="small" type="number" />
                </Grid>
                <Grid item xs={4} md={1}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Season</InputLabel>
                        <Select label="Season" value={form.season} onChange={(e) => setForm(f => ({ ...f, season: e.target.value }))}>
                            {seasons.map(s => <MenuItem key={s} value={String(s)}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={4} md={1}>
                    <TextField label="Week" value={form.week} onChange={(e) => setForm(f => ({ ...f, week: e.target.value }))} fullWidth size="small" type="number" />
                </Grid>
                <Grid item xs={6} md={1}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Result</InputLabel>
                        <Select label="Result" value={form.result} onChange={(e) => setForm(f => ({ ...f, result: e.target.value }))}>
                            <MenuItem value=""><em>—</em></MenuItem>
                            <MenuItem value={1}>Win (+1)</MenuItem>
                            <MenuItem value={0}>Push (0)</MenuItem>
                            <MenuItem value={-1}>Loss (−1)</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                    <TextField label="Game ID (optional)" value={form.gameId} onChange={(e) => setForm(f => ({ ...f, gameId: e.target.value }))} fullWidth size="small" />
                </Grid>
                <Grid item xs={12}>
                    <StevenButton onClick={handleCreate}>Create Record</StevenButton>
                </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Filters */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2, alignItems: "center" }}>
                <TextField label="Date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} size="small" sx={{ width: 150 }} />
                <TextField label="Season" value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)} size="small" sx={{ width: 100 }} />
                <TextField label="Week" value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)} size="small" sx={{ width: 80 }} />
                <TextField label="User" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} size="small" sx={{ width: 200 }} />
                <TextField label="Bet" value={betFilter} onChange={(e) => setBetFilter(e.target.value)} size="small" sx={{ width: 250 }} />
                {selectedIds.size > 0 && (
                    <StevenButton onClick={handleBulkDelete} sx={{ backgroundColor: "#b71c1c", "&:hover": { backgroundColor: "#7f0000" } }}>
                        Delete Selected ({selectedIds.size})
                    </StevenButton>
                )}
            </Box>

            <StevenTableContainer>
                <StevenTable>
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell padding="checkbox">
                                <Checkbox
                                    size="small"
                                    checked={paginatedPicks.length > 0 && paginatedPicks.every(p => selectedIds.has(p._id))}
                                    indeterminate={paginatedPicks.some(p => selectedIds.has(p._id)) && !paginatedPicks.every(p => selectedIds.has(p._id))}
                                    onChange={toggleSelectAll}
                                />
                            </StevenTableCell>
                            <StevenTableCell>Created At</StevenTableCell>
                            <StevenTableCell>Season</StevenTableCell>
                            <StevenTableCell>Week</StevenTableCell>
                            <StevenTableCell>User</StevenTableCell>
                            <StevenTableCell>Bet</StevenTableCell>
                            <StevenTableCell>Result</StevenTableCell>
                            <StevenTableCell>Update Season</StevenTableCell>
                            <StevenTableCell>Delete</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                        {paginatedPicks.map((pick) => (
                            <StevenTableRow key={pick._id} selected={selectedIds.has(pick._id)}>
                                <StevenTableCell padding="checkbox">
                                    <Checkbox size="small" checked={selectedIds.has(pick._id)} onChange={() => toggleSelect(pick._id)} />
                                </StevenTableCell>
                                <StevenTableCell>{new Date(pick.createdAt).toLocaleDateString(undefined, options)}</StevenTableCell>
                                <StevenTableCell>{pick.season}</StevenTableCell>
                                <StevenTableCell>{pick.week}</StevenTableCell>
                                <StevenTableCell>{pick.username?.split("@")[0]}</StevenTableCell>
                                <StevenTableCell>{pick.text}</StevenTableCell>
                                <StevenTableCell>
                                    <Select
                                        size="small"
                                        value={pick.result ?? ""}
                                        displayEmpty
                                        onChange={(e) => handleResultChange(pick, e.target.value)}
                                        sx={{ fontSize: 12, minWidth: 90, color: resultColor(pick.result) }}
                                    >
                                        <MenuItem value=""><em>—</em></MenuItem>
                                        <MenuItem value={1} sx={{ color: "#a5d6a7" }}>Win (+1)</MenuItem>
                                        <MenuItem value={0} sx={{ color: "#ffe082" }}>Push (0)</MenuItem>
                                        <MenuItem value={-1} sx={{ color: "#ef9a9a" }}>Loss (−1)</MenuItem>
                                    </Select>
                                </StevenTableCell>
                                <StevenTableCell>
                                    <Select
                                        size="small"
                                        value={pick.season ? String(pick.season) : ""}
                                        displayEmpty
                                        onChange={(e) => handleSeasonChange(pick, e.target.value)}
                                        sx={{ fontSize: 12, minWidth: 90 }}
                                    >
                                        <MenuItem value=""><em>—</em></MenuItem>
                                        {seasons.map(s => (
                                            <MenuItem key={s} value={String(s)}>{s}</MenuItem>
                                        ))}
                                    </Select>
                                </StevenTableCell>
                                <StevenTableCell>
                                    <Tooltip title="Delete pick">
                                        <IconButton size="small" onClick={() => handleDelete(pick)}>
                                            <BsTrash />
                                        </IconButton>
                                    </Tooltip>
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
    );
};

export default CalculateScoring;
