import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import PageLoader from "../PageLoader";
import StevenButton from "../Common/StevenButton";
import apiClient from "../../services/apiClient";

const STATUS_COLOR = {
    "Out": "error",
    "Doubtful": "error",
    "Questionable": "warning",
    "Probable": "success",
    "IR": "error",
};

const STATUS_LABEL = {
    "Questionable": "Quest",
};

const teamLogoSrc = (teamName) => {
    if (!teamName) return null;
    const last = teamName.trim().split(" ").pop();
    return `/logos/${last}.png`;
};

const InjuryList = ({ teamName, injuries }) => (
    <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
            <img src={teamLogoSrc(teamName)} alt="" width={28} height={28} style={{ objectFit: "contain" }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                {teamName}
            </Typography>
        </Box>
        {injuries.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                No injuries reported
            </Typography>
        ) : (
            injuries.map((inj, i) => (
                <Box key={i} sx={{ py: 0.75, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                            {inj.name} <Typography component="span" sx={{ fontSize: 11, color: "text.secondary", fontWeight: 400 }}>{inj.position}</Typography>
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <Chip
                            label={STATUS_LABEL[inj.status] || inj.status}
                            size="small"
                            color={STATUS_COLOR[inj.status] || "default"}
                            sx={{ fontSize: 11 }}
                        />
                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{inj.type}</Typography>
                    </Box>
                </Box>
            ))
        )}
    </Box>
);

const StevenInjuryInfo = ({ open, onClose, homeTeam, awayTeam, commenceTime }) => {
    const [loading, setLoading] = useState(false);
    const [injuries, setInjuries] = useState({ home: [], away: [] });

    useEffect(() => {
        if (!open || !homeTeam || !awayTeam) return;
        setLoading(true);
        const params = new URLSearchParams({ home: homeTeam, away: awayTeam });
        if (commenceTime) params.set('commenceTime', commenceTime);
        apiClient.get(`/api/injuries?${params.toString()}`)
            .then(res => setInjuries(res.data || { home: [], away: [] }))
            .catch(() => setInjuries({ home: [], away: [] }))
            .finally(() => setLoading(false));
    }, [open, homeTeam, awayTeam]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Injury Report</DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <PageLoader />
                ) : (
                    <Box sx={{ display: "flex", gap: 3 }}>
                        <InjuryList teamName={awayTeam} injuries={injuries.away} />
                        <Box sx={{ width: "1px", bgcolor: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                        <InjuryList teamName={homeTeam} injuries={injuries.home} />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <StevenButton onClick={onClose}>Close</StevenButton>
            </DialogActions>
        </Dialog>
    );
};

export default StevenInjuryInfo;
