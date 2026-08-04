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
import { BsPencil, BsTrash, BsStar, BsStarFill } from "react-icons/bs";
import StevenButton from "../../Common/StevenButton";
import gameService from "../../../services/gameService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../../Common/StevenTable";

const NFL_TEAMS = [
    "Arizona Cardinals","Atlanta Falcons","Baltimore Ravens","Buffalo Bills",
    "Carolina Panthers","Chicago Bears","Cincinnati Bengals","Cleveland Browns",
    "Dallas Cowboys","Denver Broncos","Detroit Lions","Green Bay Packers",
    "Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Kansas City Chiefs",
    "Las Vegas Raiders","Los Angeles Chargers","Los Angeles Rams","Miami Dolphins",
    "Minnesota Vikings","New England Patriots","New Orleans Saints","New York Giants",
    "New York Jets","Philadelphia Eagles","Pittsburgh Steelers","San Francisco 49ers",
    "Seattle Seahawks","Tampa Bay Buccaneers","Tennessee Titans","Washington Commanders"
];

const TeamLogo = ({ team, size = 24 }) => {
    if (!team) return null;
    const name = team.split(" ").pop();
    return (
        <img
            src={`/logos/${name}.png`}
            alt={team}
            width={size}
            height={size}
            style={{ objectFit: "contain", marginRight: 8, verticalAlign: "middle" }}
            onError={(e) => { e.target.style.display = "none"; }}
        />
    );
};

const TeamSelect = ({ label, value, onChange }) => (
    <FormControl fullWidth size="small">
        <InputLabel>{label}</InputLabel>
        <Select
            value={value}
            label={label}
            onChange={(e) => onChange(e.target.value)}
            renderValue={(val) => val ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <TeamLogo team={val} />
                    {val}
                </Box>
            ) : ""}
        >
            <MenuItem value=""><em>Select a team</em></MenuItem>
            {NFL_TEAMS.map((team) => (
                <MenuItem key={team} value={team}>
                    <TeamLogo team={team} />
                    {team}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
);

const EMPTY_FORM = {
    gameId: "",
    home_team: "",
    away_team: "",
    commence_time: "",
    home_spread: "",
    away_spread: "",
    over: "",
    under: "",
    season: "",
    week: "",
};

const ManageGames = () => {
    const [games, setGames] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchGames = async () => {
        try {
            const res = await gameService.getGames();
            const data = res.data || [];
            const hasExplicitGotw = data.some(g => g.isGotw);
            if (!hasExplicitGotw && data.length > 0) {
                const latest = [...data].sort((a, b) => new Date(b.commence_time) - new Date(a.commence_time))[0];
                latest.isGotw = true;
            }
            setGames(data);
        } catch (e) {
            setError("Error fetching games");
        }
    };

    useEffect(() => { fetchGames(); }, []);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleTeamChange = (field) => (value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleEdit = (game) => {
        setEditingId(game._id);
        const dt = game.commence_time ? game.commence_time.slice(0, 16) : "";
        setForm({
            gameId: game.gameId || "",
            home_team: game.home_team || "",
            away_team: game.away_team || "",
            commence_time: dt,
            home_spread: game.home_spread || "",
            away_spread: game.away_spread || "",
            over: game.over || "",
            under: game.under || "",
            season: game.season || "",
            week: game.week || "",
        });
        setError("");
        setSuccess("");
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setError("");
        setSuccess("");
    };

    const handleSetGotw = async (id, isCurrentGotw) => {
        try {
            await gameService.setGotw(id);
            setSuccess(isCurrentGotw ? "Game of the Week cleared." : "Game of the Week updated.");
            fetchGames();
        } catch (e) {
            setError("Error setting Game of the Week");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this game?")) return;
        try {
            await gameService.deleteGame(id);
            setSuccess("Game deleted.");
            fetchGames();
        } catch (e) {
            setError("Error deleting game");
        }
    };

    const handleSubmit = async () => {
        if (!form.home_team || !form.away_team || !form.commence_time) {
            setError("Home team, away team, and commence time are required.");
            return;
        }
        const payload = {
            ...form,
            commence_time: new Date(form.commence_time).toISOString(),
            week: form.week ? parseInt(form.week) : null,
        };
        try {
            if (editingId) {
                await gameService.updateGame(editingId, payload);
                setSuccess("Game updated successfully.");
            } else {
                await gameService.createGame(payload);
                setSuccess("Game created successfully.");
            }
            setEditingId(null);
            setForm(EMPTY_FORM);
            setError("");
            fetchGames();
        } catch (e) {
            setError("Error saving game");
        }
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Manage Games</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Form */}
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 3, mb: 3, bgcolor: "background.paper" }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                    {editingId ? "Edit Game" : "Create New Game"}
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TeamSelect label="Home Team" value={form.home_team} onChange={handleTeamChange("home_team")} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TeamSelect label="Away Team" value={form.away_team} onChange={handleTeamChange("away_team")} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Commence Time"
                            type="datetime-local"
                            value={form.commence_time}
                            onChange={handleChange("commence_time")}
                            fullWidth size="small" required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField label="Game ID (optional)" value={form.gameId} onChange={handleChange("gameId")} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField label="Home Spread" value={form.home_spread} onChange={handleChange("home_spread")} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField label="Away Spread" value={form.away_spread} onChange={handleChange("away_spread")} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField label="Over" value={form.over} onChange={handleChange("over")} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField label="Under" value={form.under} onChange={handleChange("under")} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField label="Season" value={form.season} onChange={handleChange("season")} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField label="Week" type="number" value={form.week} onChange={handleChange("week")} fullWidth size="small" />
                    </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <StevenButton onClick={handleSubmit}>
                        {editingId ? "Save Changes" : "Create Game"}
                    </StevenButton>
                    {editingId && (
                        <StevenButton onClick={handleCancel}>Cancel</StevenButton>
                    )}
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Games Table */}
            <StevenTableContainer>
                <StevenTable>
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell>Commence Time</StevenTableCell>
                            <StevenTableCell>Away</StevenTableCell>
                            <StevenTableCell>Home</StevenTableCell>
                            <StevenTableCell>Spread (H/A)</StevenTableCell>
                            <StevenTableCell>O/U</StevenTableCell>
                            <StevenTableCell>Season</StevenTableCell>
                            <StevenTableCell>Week</StevenTableCell>
                            <StevenTableCell>GOTW</StevenTableCell>
                            <StevenTableCell>Actions</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                        {games.length > 0 ? (
                            games
                                .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time))
                                .map((game) => (
                                    <StevenTableRow key={game._id} sx={game.isGotw ? { outline: "2px solid #D4AF37", outlineOffset: "-2px" } : {}}>
                                        <StevenTableCell>{new Date(game.commence_time).toLocaleString()}</StevenTableCell>
                                        <StevenTableCell>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <TeamLogo team={game.away_team} />
                                                {game.away_team}
                                            </Box>
                                        </StevenTableCell>
                                        <StevenTableCell>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <TeamLogo team={game.home_team} />
                                                {game.home_team}
                                            </Box>
                                        </StevenTableCell>
                                        <StevenTableCell>{game.home_spread} / {game.away_spread}</StevenTableCell>
                                        <StevenTableCell>{game.over} / {game.under}</StevenTableCell>
                                        <StevenTableCell>{game.season}</StevenTableCell>
                                        <StevenTableCell>{game.week}</StevenTableCell>
                                        <StevenTableCell>
                                            <Tooltip title={game.isGotw ? "Unset Game of the Week" : "Set as Game of the Week"}>
                                                <IconButton size="small" onClick={() => handleSetGotw(game._id, game.isGotw)} sx={{ color: game.isGotw ? "#D4AF37" : "inherit" }}>
                                                    {game.isGotw ? <BsStarFill /> : <BsStar />}
                                                </IconButton>
                                            </Tooltip>
                                        </StevenTableCell>
                                        <StevenTableCell>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleEdit(game)}>
                                                    <BsPencil />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(game._id)}>
                                                    <BsTrash />
                                                </IconButton>
                                            </Tooltip>
                                        </StevenTableCell>
                                    </StevenTableRow>
                                ))
                        ) : (
                            <StevenTableRow>
                                <StevenTableCell colSpan={8}>No games in the current week.</StevenTableCell>
                            </StevenTableRow>
                        )}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
        </Box>
    );
};

export default ManageGames;
