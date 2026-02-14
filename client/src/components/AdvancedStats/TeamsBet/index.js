import { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Alert, Form } from "react-bootstrap";
import "./style.css";
import { Typography } from "@mui/material";
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

const TEAM_NAMES = [
  "Arizona Cardinals","Atlanta Falcons","Baltimore Ravens","Buffalo Bills",
  "Carolina Panthers","Chicago Bears","Cincinnati Bengals","Cleveland Browns",
  "Dallas Cowboys","Denver Broncos","Detroit Lions","Green Bay Packers",
  "Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Kansas City Chiefs",
  "Las Vegas Raiders","Los Angeles Chargers","Los Angeles Rams","Miami Dolphins",
  "Minnesota Vikings","New England Patriots","New Orleans Saints","New York Giants",
  "New York Jets","Philadelphia Eagles","Pittsburgh Steelers","San Francisco 49ers",
  "Seattle Seahawks","Tampa Bay Buccaneers","Tennessee Titans","Washington Commanders"
];

const TeamsBet = () => {
  const { user, isLoading } = useAuth0();
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [seasonOptions, setSeasonOptions] = useState(["All"]);
  const [picks, setPicks] = useState([]);
  const [teamCounts, setTeamCounts] = useState({});
  const [teamRecords, setTeamRecords] = useState({});

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
    } catch {
      setError("Error fetching users");
    }
  };

  const fetchPickHistory = async (username) => {
    try {
      const response = await pickService.getPickHistory(username)
      const pickData = response.data || [];
      setPicks(pickData);

      const seasons = Array.from(
        new Set(pickData.map((i) => String(i.season)).filter(Boolean))
      ).sort((a, b) => Number(b) - Number(a));

      setSeasonOptions(["All", ...seasons]);
      setSelectedSeason((currentSeason) =>
        currentSeason === "All" || seasons.includes(currentSeason) ? currentSeason : "All"
      );
    } catch {
      setError("Error fetching picks");
    }
  };

  const processPicks = useCallback((data) => {
    const counts = {};
    const records = {};

    const addTeam = (team, result) => {
      if (!team) return;
      counts[team] = (counts[team] || 0) + 1;
      records[team] ||= { wins: 0, losses: 0, pushes: 0 };

      const numericResult = Number(result);
      if (numericResult === 1) records[team].wins++;
      else if (numericResult === -1) records[team].losses++;
      else records[team].pushes++;
    };

    data.forEach(({ type, text, result, homeTeam, awayTeam }) => {
      const parts = text.trim().split(" ");
      if (parts[0] === "Did") {
        // Skip non-submission placeholders for team-based stats.
        return;
      }

      if (type === "favorite" || type === "dog") {
        addTeam(parts.slice(0, -1).join(" "), result);
        return;
      }

      if (type === "over" || type === "under") {
        // Use canonical team fields when available to avoid text parsing errors.
        if (homeTeam && awayTeam) {
          addTeam(homeTeam, result);
          addTeam(awayTeam, result);
          return;
        }

        parts.pop();
        parts.pop();
        const try2 = parts.slice(0, 2).join(" ");
        const splitIndex = TEAM_NAMES.includes(try2) ? 2 : 3;
        const team1 = parts.slice(0, splitIndex).join(" ");
        const team2 = parts.slice(splitIndex).join(" ");

        addTeam(team1, result);
        addTeam(team2, result);
      }
    });

    setTeamCounts(counts);
    setTeamRecords(records);
  }, []);

  useEffect(() => {
    const filteredPicks = selectedSeason === "All"
      ? picks
      : picks.filter((pick) => String(pick.season) === String(selectedSeason));
    processPicks(filteredPicks);
  }, [picks, selectedSeason, processPicks]);

  const getPct = (team) => {
    const r = teamRecords[team];
    if (!r || r.wins + r.losses === 0) return "0.0%";
    return ((r.wins / (r.wins + r.losses)) * 100).toFixed(1) + "%";
  };

  const sortedTeams = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]);

  return (
    <StevenTableContainer sx={{ maxWidth: 600, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold" }}>
        Team Bet History
      </Typography>
      {error && (
        <div style={{ padding: "0 16px 16px 16px" }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

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

      <StevenTable>
        <StevenTableHead>
          <StevenTableRow>
            <StevenTableCell><b>Team</b></StevenTableCell>
            <StevenTableCell align="right"><b>Count</b></StevenTableCell>
            <StevenTableCell align="right"><b>Record</b></StevenTableCell>
            <StevenTableCell align="right"><b>Pct</b></StevenTableCell>
          </StevenTableRow>
        </StevenTableHead>

        <StevenTableBody>
          {sortedTeams.map(([team, count]) => {
            const r = teamRecords[team] || { wins: 0, losses: 0, pushes: 0 };
            return (
              <StevenTableRow key={team}>
                <StevenTableCell>{team}</StevenTableCell>
                <StevenTableCell align="right">{count}</StevenTableCell>
                <StevenTableCell align="right">
                  {r.wins}-{r.losses}-{r.pushes}
                </StevenTableCell>
                <StevenTableCell align="right">
                  {getPct(team)}
                </StevenTableCell>
              </StevenTableRow>
            );
          })}
        </StevenTableBody>
      </StevenTable>
    </StevenTableContainer>
  );
};

export default TeamsBet;
