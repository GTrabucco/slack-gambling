import { useEffect, useMemo, useState } from "react";
import { Box, FormLabel, Typography } from "@mui/material";
import pickService from "../../../services/pickService";
import StevenSelect from "../../Common/StevenSelect";
import {
  StevenTableContainer,
  StevenTable,
  StevenTableHead,
  StevenTableBody,
  StevenTableRow,
  StevenTableCell,
} from "../../Common/StevenTable";

const TYPES = ["favorite", "dog", "over", "under"];

const WeeklyCategoryOdds = () => {
  const [picks, setPicks] = useState([]);
  const [seasonOptions, setSeasonOptions] = useState(["All"]);
  const [selectedSeason, setSelectedSeason] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await pickService.getPickHistory("All", null);
        const pickData = response.data || [];
        setPicks(pickData);

        const seasons = Array.from(
          new Set(pickData.map((i) => String(i.season)).filter(Boolean))
        ).sort((a, b) => Number(b) - Number(a));

        setSeasonOptions(["All", ...seasons]);
        if (seasons.length > 0) {
          setSelectedSeason(seasons[0]);
        }
      } catch (error) {
        console.error("Error fetching weekly category odds data:", error);
      }
    };

    fetchData();
  }, []);

  const filteredPicks = useMemo(() => {
    return (selectedSeason === "All"
      ? picks
      : picks.filter((pick) => String(pick.season) === String(selectedSeason))
    ).filter((pick) => pick.week && TYPES.includes(pick.type));
  }, [picks, selectedSeason]);

  const weeklyRows = useMemo(() => {
    const groupedByWeek = Object.groupBy(filteredPicks, (pick) => String(pick.week));
    const weeks = Object.keys(groupedByWeek).sort((a, b) => Number(a) - Number(b));

    return weeks.map((week) => {
      const weekPicks = groupedByWeek[week] || [];
      const byType = Object.groupBy(weekPicks, (pick) => pick.type);

      const typeStats = TYPES.reduce((acc, type) => {
        const entries = byType[type] || [];
        const wins = entries.filter((p) => Number(p.result) === 1).length;
        const losses = entries.filter((p) => Number(p.result) === -1).length;
        const pushes = entries.filter((p) => Number(p.result) === 0).length;
        const trials = wins + losses;
        const pct = trials > 0 ? wins / trials : null;
        acc[type] = { wins, losses, pushes, trials, pct };
        return acc;
      }, {});

      const randomExpectedHits = TYPES.reduce((sum, type) => {
        return sum + (typeStats[type].pct ?? 0);
      }, 0);

      return { week, typeStats, randomExpectedHits };
    });
  }, [filteredPicks]);

  const formatPct = (pct) => {
    if (pct == null) return "-";
    return `${(pct * 100).toFixed(1)}%`;
  };

  const formatCell = (stats) => {
    return `${formatPct(stats.pct)} (${stats.wins}-${stats.losses}-${stats.pushes})`;
  };

  return (
    <StevenTableContainer sx={{ maxWidth: 1100, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
        Weekly Category Odds
      </Typography>

      <Typography sx={{ px: 2, pb: 1, color: "text.secondary", fontSize: 14 }}>
        Shows weekly hit rates by pick type. If you picked randomly, expected hits are the sum of weekly type hit rates.
      </Typography>

      <Box sx={{ px: 2, pb: 2 }}>
        <FormLabel>Season</FormLabel>
        <StevenSelect
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          options={seasonOptions.map((season) => ({ value: season, label: season }))}
        />
      </Box>

      <StevenTableContainer sx={{ margin: "0 16px 16px 16px" }}>
        <StevenTable>
          <StevenTableHead>
            <StevenTableRow>
              <StevenTableCell sx={{ fontWeight: 700 }}>Week</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Favorite</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Dog</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Over</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Under</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Random Expected Hits</StevenTableCell>
            </StevenTableRow>
          </StevenTableHead>
          <StevenTableBody>
            {weeklyRows.map((row) => (
              <StevenTableRow key={row.week}>
                <StevenTableCell>{row.week}</StevenTableCell>
                <StevenTableCell>{formatCell(row.typeStats.favorite)}</StevenTableCell>
                <StevenTableCell>{formatCell(row.typeStats.dog)}</StevenTableCell>
                <StevenTableCell>{formatCell(row.typeStats.over)}</StevenTableCell>
                <StevenTableCell>{formatCell(row.typeStats.under)}</StevenTableCell>
                <StevenTableCell>{`${row.randomExpectedHits.toFixed(2)} / 4`}</StevenTableCell>
              </StevenTableRow>
            ))}
          </StevenTableBody>
        </StevenTable>
      </StevenTableContainer>
    </StevenTableContainer>
  );
};

export default WeeklyCategoryOdds;
