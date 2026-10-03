import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Admin-only "public betting %" panel shown in the Game Info popup's Public
// Betting tab. Data comes from Covers.com consensus pages (spread + total),
// fetched once per day via publicBettingService and matched here by team.
const PublicBettingConsensus = ({ consensusData, homeTeam, awayTeam }) => {
    const row = (consensusData || []).find(
        (g) => g.homeTeam === homeTeam && g.awayTeam === awayTeam
    );

    if (!row) {
        return <Typography color="text.secondary">No public betting data available for this game.</Typography>;
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>Against the Spread</Typography>
                <Typography variant="body2">
                    {awayTeam} {row.awaySpread ? ` ${row.awaySpread}` : ""}: {row.awayPickPct} ({row.awayPicks} picks)
                </Typography>
                <Typography variant="body2">
                    {homeTeam} {row.homeSpread ? ` ${row.homeSpread}` : ""}: {row.homePickPct} ({row.homePicks} picks)
                </Typography>
            </Box>
            {row.overPct && row.underPct && (
                <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>
                        Over/Under{row.total ? ` (Total: ${row.total})` : ""}
                    </Typography>
                    <Typography variant="body2">
                        Over: {row.overPct} ({row.overPicks} picks)
                    </Typography>
                    <Typography variant="body2">
                        Under: {row.underPct} ({row.underPicks} picks)
                    </Typography>
                </Box>
            )}
            <Typography variant="caption" color="text.secondary">
                Source: Covers.com public consensus
            </Typography>
        </Box>
    );
};

export default PublicBettingConsensus;
