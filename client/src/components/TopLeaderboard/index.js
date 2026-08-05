import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import apiClient from "../../services/apiClient";

const RANKS = ["#1", "#2", "#3"];
const COLORS = [
    { bg: "rgba(212,175,55,0.15)", border: "rgba(212,175,55,0.6)", text: "#D4AF37" },
    { bg: "transparent", border: "rgba(255,255,255,0.08)", text: "#888" },
    { bg: "transparent", border: "rgba(255,255,255,0.06)", text: "#666" },
];

const TopLeaderboard = () => {
    const [top3, setTop3] = useState([]);

    useEffect(() => {
        apiClient.get("/api/leaderboard")
            .then(res => setTop3((res.data || []).slice(0, 3)))
            .catch(() => {});
    }, []);

    if (top3.length === 0) return null;

    return (
        <Box sx={{ maxWidth: 600, mx: "auto", pt: 2, pb: 1 }}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography sx={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "text.disabled" }}>
                        Top 3 Leaderboard
                    </Typography>
                </Box>
                {top3.map((player, rank) => (
                    <Box
                        key={rank}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            px: 2,
                            py: rank === 0 ? 1.5 : 1,
                            background: COLORS[rank].bg,
                            borderBottom: rank < top3.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                        }}
                    >
                        <Typography sx={{
                            fontSize: rank === 0 ? 13 : 11,
                            fontWeight: 800,
                            color: COLORS[rank].text,
                            width: 32,
                            flexShrink: 0,
                            letterSpacing: "0.05em",
                        }}>
                            {RANKS[rank]}
                        </Typography>
                        <Typography sx={{
                            flex: 1,
                            fontSize: rank === 0 ? 15 : 13,
                            fontWeight: rank === 0 ? 700 : 500,
                            color: rank === 0 ? "#FFD700" : "text.primary",
                        }}>
                            {player.displayName}
                        </Typography>
                        <Typography sx={{
                            fontSize: rank === 0 ? 14 : 12,
                            fontWeight: 700,
                            color: COLORS[rank].text,
                        }}>
                            {player.score > 0 ? `+${player.score}` : player.score} pts
                        </Typography>
                    </Box>
                ))}
            </Paper>
        </Box>
    );
};

export default TopLeaderboard;