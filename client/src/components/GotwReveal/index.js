import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import pickService from "../../services/pickService";
import userService from "../../services/userService";

const GotwReveal = ({ games, gameStarted }) => {
    const [allPicks, setAllPicks] = useState([]);
    const [users, setUsers] = useState({});

    const gotwGame = games.length > 0
        ? (games.find(g => g.isGotw) ?? [...games].sort((a, b) => new Date(b.commence_time) - new Date(a.commence_time))[0])
        : null;

    const gotwStarted = gotwGame ? gameStarted(gotwGame.commence_time) : false;

    useEffect(() => {
        if (!gotwStarted) return;

        const fetchData = async () => {
            try {
                const [picksRes, usersRes] = await Promise.all([
                    pickService.getWeeklyPicks(null),
                    userService.getAllUsers()
                ]);
                setAllPicks(picksRes.data || []);
                const userMap = {};
                for (const u of (usersRes.data || [])) {
                    userMap[u.username] = u.displayName || u.username.split("@")[0];
                }
                setUsers(userMap);
            } catch (err) {
                console.error("Error fetching GOTW reveal data", err);
            }
        };

        fetchData();
    }, [gotwStarted]);

    if (!gotwGame) return null;
    if (!gotwStarted || allPicks.length === 0) return null;

    const activeGame = gotwGame;
    const gotwId = activeGame._id;

    const displayName = (username) => users[username] || username.split("@")[0];

    const favoriteText = activeGame.home_spread < 0 ? activeGame.home_team : activeGame.away_team;
    const underdogText = activeGame.home_spread < 0 ? activeGame.away_team : activeGame.home_team;

    const favoritePickers = allPicks
        .filter(p => p.type === "gotw" && !p.text.includes("Over") && !p.text.includes("Under") && p.text.includes(favoriteText.split(" ").pop()))
        .map(p => ({ name: displayName(p.username), result: p.result, value: p.value != null ? (parseFloat(p.value) > 0 ? `+${p.value}` : `${p.value}`) : null }));
    const underdogPickers = allPicks
        .filter(p => p.type === "gotw" && !p.text.includes("Over") && !p.text.includes("Under") && p.text.includes(underdogText.split(" ").pop()))
        .map(p => ({ name: displayName(p.username), result: p.result, value: p.value != null ? (parseFloat(p.value) > 0 ? `+${p.value}` : `${p.value}`) : null }));

    const overPickers = allPicks
        .filter(p => p.type === "gotw" && p.text.includes("Over"))
        .map(p => ({ name: displayName(p.username), result: p.result, value: p.value != null ? `o${p.value}` : null }));
    const underPickers = allPicks
        .filter(p => p.type === "gotw" && p.text.includes("Under"))
        .map(p => ({ name: displayName(p.username), result: p.result, value: p.value != null ? `u${p.value}` : null }));

    const hasSpread = favoritePickers.length > 0 || underdogPickers.length > 0;
    const hasTotal = overPickers.length > 0 || underPickers.length > 0;

    const awayName = activeGame.away_team.split(" ").pop();
    const homeName = activeGame.home_team.split(" ").pop();
    const favName = favoriteText.split(" ").pop();
    const dogName = underdogText.split(" ").pop();
    const spread = Math.abs(activeGame.home_spread);

    const resultColor = (result) => {
        if (result === 1)  return { bg: "#1b5e20", color: "#a5d6a7" }; // win — dark green
        if (result === -1) return { bg: "#7f0000", color: "#ef9a9a" }; // loss — dark red
        if (result === 0)  return { bg: "#4a3800", color: "#ffe082" }; // push — dark gold
        return { bg: "action.hover", color: "text.primary" };           // unscored
    };

    const SideColumn = ({ label, pickers }) => {
        const scored = pickers.filter(p => p.result !== undefined);
        const wins   = scored.filter(p => p.result === 1).length;
        const losses = scored.filter(p => p.result === -1).length;
        const pushes = scored.filter(p => p.result === 0).length;
        const isScored = scored.length > 0;

        return (
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, p: 2 }}>
                <Typography variant="body2" fontWeight={600} sx={{ textAlign: "center" }}>
                    {label}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center", mt: 0.5 }}>
                    {pickers.length > 0
                        ? pickers.map(({ name, result, value }) => {
                            const { bg, color } = resultColor(result);
                            return (
                                <Chip
                                    key={name}
                                    label={value ? `${name} ${value}` : name}
                                    size="small"
                                    sx={{ bgcolor: bg, color, fontSize: "0.7rem" }}
                                />
                            );
                        })
                        : <Typography variant="caption" color="text.disabled">-</Typography>
                    }
                </Box>
                {isScored ? (
                    <Typography variant="caption" sx={{ mt: 1, color: "text.secondary" }}>
                        {wins > 0 && <span style={{ color: "#a5d6a7" }}>{wins}W </span>}
                        {losses > 0 && <span style={{ color: "#ef9a9a" }}>{losses}L </span>}
                        {pushes > 0 && <span style={{ color: "#ffe082" }}>{pushes}P</span>}
                    </Typography>
                ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                        {pickers.length} {pickers.length === 1 ? "pick" : "picks"}
                    </Typography>
                )}
            </Box>
        );
    };

    const PickRow = ({ leftLabel, leftPickers, rightLabel, rightPickers }) => (
        <Box sx={{ display: "flex", alignItems: "stretch" }}>
            <SideColumn label={leftLabel} pickers={leftPickers} />
            <Divider orientation="vertical" flexItem />
            <SideColumn label={rightLabel} pickers={rightPickers} />
        </Box>
    );

    return (
        <Box sx={{ mb: 2.5, maxWidth: 600, mx: "auto" }}>
            <Paper sx={{
                border: "2px solid #D4AF37",
                boxShadow: "0 2px 16px rgba(212, 175, 55, 0.35)",
                borderRadius: 2,
                overflow: "hidden"
            }} elevation={4}>
                <Box sx={{
                    background: "linear-gradient(90deg, #9a7c0a 0%, #D4AF37 40%, #F5CB5C 70%, #D4AF37 100%)",
                    color: "#3d2b00",
                    px: 1.5,
                    py: 0.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: "0.8rem", letterSpacing: "0.04em" }}>
                        GAME OF THE WEEK — {awayName} @ {homeName}
                    </Typography>
                </Box>

                {hasSpread && (
                    <PickRow
                        leftLabel={favName}
                        leftPickers={favoritePickers}
                        rightLabel={dogName}
                        rightPickers={underdogPickers}
                    />
                )}

                {hasSpread && hasTotal && <Divider />}

                {hasTotal && (
                    <PickRow
                        leftLabel="Over"
                        leftPickers={overPickers}
                        rightLabel="Under"
                        rightPickers={underPickers}
                    />
                )}
            </Paper>
        </Box>
    );
};

export default GotwReveal;