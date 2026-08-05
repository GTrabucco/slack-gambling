import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import { BsTrash } from "react-icons/bs";
import StevenButton from "../../Common/StevenButton";
import pickService from "../../../services/pickService";
import gameService from "../../../services/gameService";
import userService from "../../../services/userService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../../Common/StevenTable";

const PICK_TYPES = ["favorite", "dog", "over", "under", "gotw"];

const TYPE_COLOR = {
    favorite: "primary",
    dog: "secondary",
    over: "success",
    under: "warning",
    gotw: "default",
};

const EMPTY_FORM = { username: "", gameId: "", type: "", value: "", text: "" };

const ManagePicks = () => {
    const [picks, setPicks] = useState([]);
    const [games, setGames] = useState([]);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [userFilter, setUserFilter] = useState("");

    const fetchAll = async () => {
        try {
            const [picksRes, gamesRes, usersRes] = await Promise.all([
                pickService.getWeeklyPicks(null),
                gameService.getGames(),
                userService.getAllUsers(),
            ]);
            setPicks(picksRes.data || []);
            setGames(gamesRes.data || []);
            setUsers(usersRes.data || []);
        } catch (e) {
            setError("Error loading data");
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleGameChange = (gameId) => {
        const game = games.find(g => g._id === gameId || g.gameId === gameId);
        setForm(prev => ({
            ...prev,
            gameId: game?.gameId ?? gameId,
            text: "",
            value: "",
        }));
    };

    const handleTypeChange = (type) => {
        const game = games.find(g => g.gameId === form.gameId || g._id === form.gameId);
        let value = "";
        let text = "";
        if (game) {
            const homeSpread = parseFloat(game.home_spread);
            const awaySpread = parseFloat(game.away_spread);
            if (type === "favorite") {
                const fav = homeSpread < awaySpread ? game.home_team : game.away_team;
                const spread = homeSpread < awaySpread ? game.home_spread : game.away_spread;
                value = spread; text = `${fav} ${spread}`;
            } else if (type === "dog") {
                const dog = homeSpread > awaySpread ? game.home_team : game.away_team;
                const spread = homeSpread > awaySpread ? game.home_spread : game.away_spread;
                value = spread; text = `${dog} ${spread}`;
            } else if (type === "over") {
                value = game.over; text = `${game.home_team} ${game.away_team} Over ${game.over}`;
            } else if (type === "under") {
                value = game.under; text = `${game.home_team} ${game.away_team} Under ${game.under}`;
            } else if (type === "gotw") {
                const fav = homeSpread < awaySpread ? game.home_team : game.away_team;
                const spread = homeSpread < awaySpread ? game.home_spread : game.away_spread;
                value = spread; text = `${fav} ${spread}`;
            }
        }
        setForm(prev => ({ ...prev, type, value, text }));
    };

    const handleSubmit = async () => {
        if (!form.username || !form.gameId || !form.type) {
            setError("Username, game, and pick type are required.");
            return;
        }
        const game = games.find(g => g.gameId === form.gameId || g._id === form.gameId);
        try {
            await pickService.adminCreatePick({
                ...form,
                homeTeam: game?.home_team ?? "",
                awayTeam: game?.away_team ?? "",
                season: game?.season ?? null,
                week: game?.week ?? null,
            });
            setSuccess(`Pick created for ${form.username.split("@")[0]}.`);
            setForm(EMPTY_FORM);
            setError("");
            fetchAll();
        } catch (e) {
            setError("Error creating pick");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this pick?")) return;
        try {
            await pickService.adminDeletePick(id);
            setSuccess("Pick deleted.");
            fetchAll();
        } catch (e) {
            setError("Error deleting pick");
        }
    };

    const selectedGame = games.find(g => g.gameId === form.gameId || g._id === form.gameId);

    const filteredPicks = userFilter
        ? picks.filter(p => p.username.toLowerCase().includes(userFilter.toLowerCase()))
        : picks;

    // Group by username
    const grouped = filteredPicks.reduce((acc, pick) => {
        const key = pick.username;
        if (!acc[key]) acc[key] = [];
        acc[key].push(pick);
        return acc;
    }, {});

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Manage Picks</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Create Pick Form */}
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 3, mb: 3, bgcolor: "background.paper" }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Create Pick</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>User</InputLabel>
                            <Select value={form.username} label="User" onChange={handleChange("username")}>
                                <MenuItem value=""><em>Select user</em></MenuItem>
                                {users.map(u => (
                                    <MenuItem key={u.username} value={u.username}>
                                        {u.displayName || u.username.split("@")[0]}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Game</InputLabel>
                            <Select value={form.gameId} label="Game" onChange={(e) => handleGameChange(e.target.value)}>
                                <MenuItem value=""><em>Select game</em></MenuItem>
                                {games.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time)).map(g => (
                                    <MenuItem key={g._id} value={g.gameId ?? g._id}>
                                        {g.away_team} @ {g.home_team}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select value={form.type} label="Type" onChange={(e) => handleTypeChange(e.target.value)}>
                                <MenuItem value=""><em>Select type</em></MenuItem>
                                {PICK_TYPES.map(t => (
                                    <MenuItem key={t} value={t}>{t === "gotw" ? "GOTW" : t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={1}>
                        <TextField label="Value" value={form.value} onChange={handleChange("value")} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <TextField label="Text" value={form.text} onChange={handleChange("text")} fullWidth size="small" />
                    </Grid>
                </Grid>
                {selectedGame && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        {selectedGame.away_team} @ {selectedGame.home_team} | Spread: {selectedGame.away_spread}/{selectedGame.home_spread} | O/U: {selectedGame.over}
                    </Typography>
                )}
                <Box sx={{ mt: 2 }}>
                    <StevenButton onClick={handleSubmit}>Create Pick</StevenButton>
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Filter */}
            <Box sx={{ mb: 2 }}>
                <TextField
                    label="Filter by user"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    size="small"
                    sx={{ width: 250 }}
                />
            </Box>

            {/* Picks grouped by user */}
            {Object.keys(grouped).sort().map(username => (
                <Box key={username} sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        {username.split("@")[0]}
                        <Chip label={`${grouped[username].length} pick${grouped[username].length !== 1 ? "s" : ""}`} size="small" sx={{ ml: 1 }} />
                    </Typography>
                    <StevenTableContainer>
                        <StevenTable>
                            <StevenTableHead>
                                <StevenTableRow>
                                    <StevenTableCell>Type</StevenTableCell>
                                    <StevenTableCell>Game ID</StevenTableCell>
                                    <StevenTableCell>Game</StevenTableCell>
                                    <StevenTableCell>Text</StevenTableCell>
                                    <StevenTableCell>Value</StevenTableCell>
                                    <StevenTableCell>Created</StevenTableCell>
                                    <StevenTableCell>Delete</StevenTableCell>
                                </StevenTableRow>
                            </StevenTableHead>
                            <StevenTableBody>
                                {grouped[username]
                                    .sort((a, b) => PICK_TYPES.indexOf(a.type) - PICK_TYPES.indexOf(b.type))
                                    .map(pick => (
                                        <StevenTableRow key={pick._id}>
                                            <StevenTableCell>
                                                <Chip
                                                    label={pick.type === "gotw" ? "GOTW" : pick.type}
                                                    color={TYPE_COLOR[pick.type] || "default"}
                                                    size="small"
                                                    sx={pick.type === "gotw" ? { bgcolor: "#D4AF37", color: "#000", fontWeight: 700 } : {}}
                                                />
                                            </StevenTableCell>
                                            <StevenTableCell sx={{ fontSize: 11, fontFamily: "monospace", color: "text.secondary" }}>
                                                {pick.gameId ?? "—"}
                                            </StevenTableCell>
                                            <StevenTableCell>
                                                {pick.awayTeam && pick.homeTeam
                                                    ? `${pick.awayTeam} @ ${pick.homeTeam}`
                                                    : "—"}
                                            </StevenTableCell>
                                            <StevenTableCell>{pick.text}</StevenTableCell>
                                            <StevenTableCell>{pick.value}</StevenTableCell>
                                            <StevenTableCell>
                                                {pick.createdAt ? new Date(pick.createdAt).toLocaleString() : "—"}
                                            </StevenTableCell>
                                            <StevenTableCell>
                                                <Tooltip title="Delete pick">
                                                    <IconButton size="small" onClick={() => handleDelete(pick._id)}>
                                                        <BsTrash />
                                                    </IconButton>
                                                </Tooltip>
                                            </StevenTableCell>
                                        </StevenTableRow>
                                    ))}
                            </StevenTableBody>
                        </StevenTable>
                    </StevenTableContainer>
                </Box>
            ))}

            {Object.keys(grouped).length === 0 && (
                <Typography color="text.secondary">No picks found.</Typography>
            )}
        </Box>
    );
};

export default ManagePicks;
