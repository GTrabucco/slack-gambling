import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { FaFire } from "react-icons/fa";
import apiClient from "../../services/apiClient";
import DonorBadge from "../Common/DonorBadge";

const PerfectWeekWatch = () => {
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        apiClient.get("/api/perfect-week-watch")
            .then(res => setPlayers(res.data || []))
            .catch(() => {});
    }, []);

    if (players.length === 0) return null;

    return (
        <Box sx={{ maxWidth: 600, mx: "auto", pt: 2, pb: 1 }}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,100,0,0.25)" }}>
                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography sx={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "text.disabled" }}>
                        Perfect Week Watch
                    </Typography>
                </Box>
                {players.map((player, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            px: 2,
                            py: 1,
                            borderBottom: idx < players.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                        }}
                    >
                        <FaFire style={{ fontSize: 13, color: "#FF6B00", flexShrink: 0, marginRight: 8 }} />
                        <Typography sx={{
                            flex: 1,
                            fontSize: 13,
                            fontWeight: 500,
                            color: "text.primary",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}>
                            {player.displayName}
                            {player.donationAmount > 0 && <DonorBadge amount={player.donationAmount} />}
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#FF6B00" }}>
                            {player.record.wins}-{player.record.losses}{player.record.pushes ? `-${player.record.pushes}` : ""}
                        </Typography>
                    </Box>
                ))}
            </Paper>
        </Box>
    );
};

export default PerfectWeekWatch;
