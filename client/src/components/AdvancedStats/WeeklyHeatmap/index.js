import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Form } from "react-bootstrap";
import { Box, Typography } from "@mui/material";
import userService from "../../../services/userService";
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

const PICK_TYPES = ["favorite", "dog", "over", "under"];

const WeeklyHeatmap = () => {
  const { user, isLoading } = useAuth0();
  const [users, setUsers] = useState([]);
  const [picks, setPicks] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("All");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [seasonOptions, setSeasonOptions] = useState(["All"]);

  useEffect(() => {
    if (!isLoading && user?.name) {
      setSelectedPlayer(user.name);
      getUsers();
      fetchPickHistory(user.name);
    }
  }, [isLoading, user]);

  const getUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      const sorted = [...response.data].sort((a, b) => {
        const aName = (a.displayName || a.username).toLowerCase();
        const bName = (b.displayName || b.username).toLowerCase();
        return aName.localeCompare(bName);
      });

      sorted.unshift({ username: "All", displayName: "All" });
      setUsers(sorted);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchPickHistory = async (username) => {
    try {
      const response = await pickService.getPickHistory(username);
      const pickData = response.data || [];
      setPicks(pickData);

      const seasons = Array.from(
        new Set(pickData.map((i) => String(i.season)).filter(Boolean))
      ).sort((a, b) => Number(b) - Number(a));

      setSeasonOptions(["All", ...seasons]);
      setSelectedSeason((currentSeason) =>
        currentSeason === "All" || seasons.includes(currentSeason) ? currentSeason : "All"
      );
    } catch (error) {
      console.error("Error fetching picks:", error);
    }
  };

  const filteredPicks = (selectedSeason === "All"
    ? picks
    : picks.filter((pick) => String(pick.season) === String(selectedSeason)))
    .filter((pick) => PICK_TYPES.includes(pick.type));

  const groupedByWeek = Object.groupBy(
    filteredPicks,
    (pick) => String(pick.week ?? "Unknown")
  );

  const sortedWeeks = Object.keys(groupedByWeek).sort((a, b) => {
    const aNum = Number(a);
    const bNum = Number(b);
    const aIsNum = !Number.isNaN(aNum);
    const bIsNum = !Number.isNaN(bNum);

    if (aIsNum && bIsNum) return bNum - aNum;
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return b.localeCompare(a);
  });

  const getCellStats = (week, type) => {
    const entries = (groupedByWeek[week] || []).filter((pick) => pick.type === type);
    if (entries.length === 0) return null;

    const wins = entries.filter((pick) => pick.result === 1).length;
    const losses = entries.filter((pick) => pick.result === -1).length;
    const pushes = entries.filter((pick) => pick.result === 0).length;
    const score = entries.reduce((acc, pick) => acc + pick.result, 0) / entries.length;
    const pct = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : "-";

    return { wins, losses, pushes, score, pct, count: entries.length };
  };

  const getHeatColor = (score) => {
    if (score === null || score === undefined) return "#f3f4f6";
    if (score >= 0.75) return "#0f766e";
    if (score >= 0.25) return "#34d399";
    if (score > -0.25) return "#fde68a";
    if (score > -0.75) return "#fca5a5";
    return "#b91c1c";
  };

  const getTextColor = (score) => {
    if (score === null || score === undefined) return "#6b7280";
    if (score >= 0.75 || score <= -0.75) return "#ffffff";
    return "#111827";
  };

  return (
    <StevenTableContainer sx={{ maxWidth: 900, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
        Weekly Accuracy Heatmap
      </Typography>

      <Box sx={{ px: 2, pb: 1, color: "text.secondary", fontSize: 14 }}>
        Color is based on average result per cell: +1 win, 0 push, -1 loss.
      </Box>

      <Form.Group controlId="playerSelect" style={{ padding: "0 16px 16px 16px" }}>
        <Form.Label>Player</Form.Label>
        <StevenSelect
          value={selectedPlayer}
          onChange={(e) => {
            setSelectedPlayer(e.target.value);
            fetchPickHistory(e.target.value);
          }}
          options={users.map((u) => ({
            value: u.username,
            label: u.displayName || u.username.split("@")[0],
          }))}
        />
      </Form.Group>

      <Form.Group controlId="seasonSelect" style={{ padding: "0 16px 16px 16px" }}>
        <Form.Label>Season</Form.Label>
        <StevenSelect
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          options={seasonOptions.map((season) => ({
            value: season,
            label: season,
          }))}
        />
      </Form.Group>

      <Box sx={{ px: 2, pb: 2 }}>
        <StevenTableContainer>
          <StevenTable>
            <StevenTableHead>
              <StevenTableRow>
                <StevenTableCell sx={{ fontWeight: 700 }}>Week</StevenTableCell>
                <StevenTableCell sx={{ fontWeight: 700 }}>Favorite</StevenTableCell>
                <StevenTableCell sx={{ fontWeight: 700 }}>Dog</StevenTableCell>
                <StevenTableCell sx={{ fontWeight: 700 }}>Over</StevenTableCell>
                <StevenTableCell sx={{ fontWeight: 700 }}>Under</StevenTableCell>
              </StevenTableRow>
            </StevenTableHead>
            <StevenTableBody>
              {sortedWeeks.map((week) => (
                <StevenTableRow key={week}>
                  <StevenTableCell sx={{ fontWeight: 600 }}>{week}</StevenTableCell>
                  {PICK_TYPES.map((type) => {
                    const stats = getCellStats(week, type);
                    const score = stats ? stats.score : null;

                    return (
                      <StevenTableCell
                        key={`${week}-${type}`}
                        sx={{
                          backgroundColor: getHeatColor(score),
                          color: getTextColor(score),
                          minWidth: 130,
                          verticalAlign: "top",
                        }}
                      >
                        {stats ? (
                          <>
                            <div>{`${stats.wins}-${stats.losses}-${stats.pushes}`}</div>
                            <div style={{ fontSize: 12 }}>{`${stats.pct}% (${stats.count})`}</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12 }}>No picks</div>
                        )}
                      </StevenTableCell>
                    );
                  })}
                </StevenTableRow>
              ))}
            </StevenTableBody>
          </StevenTable>
        </StevenTableContainer>
      </Box>
    </StevenTableContainer>
  );
};

export default WeeklyHeatmap;
