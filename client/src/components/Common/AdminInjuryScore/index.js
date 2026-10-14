import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import apiClient from "../../../services/apiClient";
import injuryScoreService, { fallbackWeight } from "../../../services/injuryScoreService";

// Injury score = sum over every injured depth-chart player of
//   positionWeight[position][rank] * statusFactor[status]
// Healthy players contribute 0. Higher score = more hurt team.
// Weights are admin-configurable (see Admin > Injury Score Weights).

export const computeInjuryScore = (formations, injuries, settings) => {
    const { positionWeight, statusFactor } = settings;
    const statusByName = {};
    for (const inj of (injuries || [])) {
        if (inj.name && statusFactor[inj.status] != null) statusByName[inj.name] = inj.status;
    }

    let total = 0;
    const details = [];
    const counted = new Set();
    for (const formation of (formations || [])) {
        for (const pos of formation.positions) {
            const status = statusByName[pos.player];
            if (!status) continue;
            // A player can appear in several formations; count each position slot once.
            const key = `${pos.player}__${pos.position}__${pos.rank}`;
            if (counted.has(key)) continue;
            counted.add(key);
            const points =
                (positionWeight[pos.position]?.[pos.rank] ?? fallbackWeight(pos.rank)) *
                statusFactor[status];
            total += points;
            details.push({ player: pos.player, position: pos.position, rank: pos.rank, status, points });
        }
    }
    details.sort((a, b) => b.points - a.points);
    return { total, details };
};

const breakdown = (teamName, { details }) => (
    <Box sx={{ fontSize: 12 }}>
        <b>{teamName}</b>
        {details.length === 0 && <div>No injured depth-chart players</div>}
        {details.map((d, i) => (
            <div key={i}>
                {d.player} ({d.position}{d.rank >= 2 ? " backup" : ""}) {d.status}: {d.points.toFixed(2)}
            </div>
        ))}
    </Box>
);

// Callers must gate rendering on admin / donor-threshold access (canViewInjuryScore).
const AdminInjuryScore = ({ homeTeam, awayTeam, commenceTime, username }) => {
    const [scores, setScores] = useState(null);

    useEffect(() => {
        if (!homeTeam || !awayTeam) return;
        let cancelled = false;
        const qs = `home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&commenceTime=${encodeURIComponent(commenceTime)}`;
        Promise.all([
            apiClient.get(`/api/injuries?${qs}`),
            apiClient.get(`/api/depthchart?${qs}`),
            injuryScoreService.getSettings(username),
        ]).then(([inj, depth, settings]) => {
            if (cancelled) return;
            setScores({
                away: computeInjuryScore(depth.data?.away, inj.data?.away, settings),
                home: computeInjuryScore(depth.data?.home, inj.data?.home, settings),
            });
        }).catch(() => { });
        return () => { cancelled = true; };
    }, [homeTeam, awayTeam, commenceTime, username]);

    if (!scores) return null;

    const cell = (teamName, s) => (
        <Tooltip title={breakdown(teamName, s)} arrow enterTouchDelay={0}>
            <Typography component="span" variant="caption" sx={{ flex: 1, textAlign: "center", cursor: "help" }}>
                Injury score: <b>{s.total.toFixed(1)}</b>
            </Typography>
        </Tooltip>
    );

    return (
        <Box sx={{ display: "flex", px: 1.5, pb: 1, color: "text.secondary" }}>
            {cell(awayTeam, scores.away)}
            {cell(homeTeam, scores.home)}
            <Box sx={{ width: "22%" }} />
        </Box>
    );
};

export default AdminInjuryScore;
