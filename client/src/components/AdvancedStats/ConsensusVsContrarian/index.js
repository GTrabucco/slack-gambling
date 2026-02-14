import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Form } from "react-bootstrap";
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

const ConsensusVsContrarian = () => {
  const { user, isLoading } = useAuth0();
  const [users, setUsers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("All");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [seasonOptions, setSeasonOptions] = useState(["All"]);
  const [picks, setPicks] = useState([]);

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
      setSelectedSeason((current) =>
        current === "All" || seasons.includes(current) ? current : "All"
      );
    } catch (error) {
      console.error("Error fetching picks:", error);
    }
  };

  const filteredPicks = useMemo(() => {
    return (selectedSeason === "All"
      ? picks
      : picks.filter((p) => String(p.season) === String(selectedSeason))
    ).filter((p) => p.gameId && p.type && p.text);
  }, [picks, selectedSeason]);

  const stats = useMemo(() => {
    const result = {
      consensus: { wins: 0, losses: 0, pushes: 0, total: 0 },
      contrarian: { wins: 0, losses: 0, pushes: 0, total: 0 },
    };

    const marketKey = (pick) => {
      const marketType = ["favorite", "dog"].includes(pick.type) ? "spread" : "total";
      return `${pick.gameId}-${marketType}`;
    };

    const grouped = Object.groupBy(filteredPicks, marketKey);

    Object.values(grouped).forEach((marketPicks) => {
      const counts = marketPicks.reduce((acc, pick) => {
        const option = pick.text;
        acc[option] = (acc[option] || 0) + 1;
        return acc;
      }, {});

      const sortedOptions = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sortedOptions.length === 0) return;
      if (sortedOptions.length > 1 && sortedOptions[0][1] === sortedOptions[1][1]) return;

      const consensusOption = sortedOptions[0][0];

      marketPicks.forEach((pick) => {
        const bucketName = pick.text === consensusOption ? "consensus" : "contrarian";
        const bucket = result[bucketName];
        const pickResult = Number(pick.result);
        bucket.total += 1;
        if (pickResult === 1) bucket.wins += 1;
        else if (pickResult === -1) bucket.losses += 1;
        else bucket.pushes += 1;
      });
    });

    return result;
  }, [filteredPicks]);

  const formatRow = (record) => {
    return `${record.wins}-${record.losses}-${record.pushes}`;
  };

  return (
    <StevenTableContainer sx={{ maxWidth: 900, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
        Consensus vs Contrarian
      </Typography>

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
          options={seasonOptions.map((season) => ({ value: season, label: season }))}
        />
      </Form.Group>

      <StevenTableContainer sx={{ margin: "0 16px 16px 16px" }}>
        <StevenTable>
          <StevenTableHead>
            <StevenTableRow>
              <StevenTableCell sx={{ fontWeight: 700 }}>Bucket</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Record</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Win %</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Picks</StevenTableCell>
            </StevenTableRow>
          </StevenTableHead>
          <StevenTableBody>
            <StevenTableRow>
              <StevenTableCell>Consensus</StevenTableCell>
              <StevenTableCell>{formatRow(stats.consensus)}</StevenTableCell>
              <StevenTableCell>
                {stats.consensus.wins + stats.consensus.losses > 0
                  ? `${((stats.consensus.wins / (stats.consensus.wins + stats.consensus.losses)) * 100).toFixed(1)}%`
                  : "-"}
              </StevenTableCell>
              <StevenTableCell>{stats.consensus.total}</StevenTableCell>
            </StevenTableRow>
            <StevenTableRow>
              <StevenTableCell>Contrarian</StevenTableCell>
              <StevenTableCell>{formatRow(stats.contrarian)}</StevenTableCell>
              <StevenTableCell>
                {stats.contrarian.wins + stats.contrarian.losses > 0
                  ? `${((stats.contrarian.wins / (stats.contrarian.wins + stats.contrarian.losses)) * 100).toFixed(1)}%`
                  : "-"}
              </StevenTableCell>
              <StevenTableCell>{stats.contrarian.total}</StevenTableCell>
            </StevenTableRow>
          </StevenTableBody>
        </StevenTable>
      </StevenTableContainer>
    </StevenTableContainer>
  );
};

export default ConsensusVsContrarian;
