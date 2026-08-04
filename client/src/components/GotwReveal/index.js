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
        .map(p => displayName(p.username));
    const underdogPickers = allPicks
        .filter(p => p.type === "gotw" && !p.text.includes("Over") && !p.text.includes("Under") && p.text.includes(underdogText.split(" ").pop()))
        .map(p => displayName(p.username));

    const overPickers = allPicks
        .filter(p => p.type === "gotw" && p.text.includes("Over"))
        .map(p => displayName(p.username));
    const underPickers = allPicks
        .filter(p => p.type === "gotw" && p.text.includes("Under"))
        .map(p => displayName(p.username));

    const hasSpread = favoritePickers.length > 0 || underdogPickers.length > 0;
    const hasTotal = overPickers.length > 0 || underPickers.length > 0;

    const awayName = activeGame.away_team.split(" ").pop();
    const homeName = activeGame.home_team.split(" ").pop();
    const favName = favoriteText.split(" ").pop();
    const dogName = underdogText.split(" ").pop();
    const spread = Math.abs(activeGame.home_spread);

    const SideColumn = ({ label, sublabel, pickers }) => (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, p: 2 }}>
            <Typography variant="body2" fontWeight={600} sx={{ textAlign: "center" }}>
                {label}
            </Typography>
            {sublabel && (
                <Typography variant="caption" sx={{ color: "text.disabled", textAlign: "center" }}>
                    {sublabel}
                </Typography>
            )}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center", mt: 0.5 }}>
                {pickers.length > 0
                    ? pickers.map(name => (
                        <Chip key={name} label={name} size="small" sx={{ bgcolor: "action.hover", color: "text.primary", fontSize: "0.7rem" }} />
                    ))
                    : <Typography variant="caption" color="text.disabled">-</Typography>
                }
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                {pickers.length} {pickers.length === 1 ? "pick" : "picks"}
            </Typography>
        </Box>
    );

    const PickRow = ({ leftLabel, leftSub, leftPickers, rightLabel, rightSub, rightPickers }) => (
        <Box sx={{ display: "flex", alignItems: "stretch" }}>
            <SideColumn label={leftLabel} sublabel={leftSub} pickers={leftPickers} />
            <Divider orientation="vertical" flexItem />
            <SideColumn label={rightLabel} sublabel={rightSub} pickers={rightPickers} />
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
                        leftSub={`-${spread}`}
                        leftPickers={favoritePickers}
                        rightLabel={dogName}
                        rightSub={`+${spread}`}
                        rightPickers={underdogPickers}
                    />
                )}

                {hasSpread && hasTotal && <Divider />}

                {hasTotal && (
                    <PickRow
                        leftLabel="Over"
                        leftSub={`${activeGame.over}`}
                        leftPickers={overPickers}
                        rightLabel="Under"
                        rightSub={`${activeGame.over}`}
                        rightPickers={underPickers}
                    />
                )}
            </Paper>
        </Box>
    );
};

export default GotwReveal;