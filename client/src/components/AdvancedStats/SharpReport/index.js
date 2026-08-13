import { useEffect, useMemo, useState } from "react";
import { Box, FormLabel, Typography, Chip } from "@mui/material";
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

const CLV_CHIP_COLOR = (clv) => {
  if (clv >= 5) return "success";
  if (clv >= 3.5) return "warning";
  return "default";
};

const SharpReport = () => {
  const [allRows, setAllRows] = useState([]);
  const [seasonOptions, setSeasonOptions] = useState(["All"]);
  const [selectedSeason, setSelectedSeason] = useState("All");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await pickService.getSharpReport();
      const data = response.data || [];
      setAllRows(data);
      const seasons = [...new Set(data.map((d) => String(d.season)).filter(Boolean))].sort((a, b) => b - a);
      setSeasonOptions(["All", ...seasons]);
    } catch (error) {
      console.error("Error fetching sharp report:", error);
    }
  };

  const rows = useMemo(() => {
    return selectedSeason === "All"
      ? allRows
      : allRows.filter((d) => String(d.season) === selectedSeason);
  }, [allRows, selectedSeason]);

  const formatLine = (type, value) => {
    if (type === "over") return `O ${value}`;
    if (type === "under") return `U ${value}`;
    return value > 0 ? `+${value}` : String(value);
  };

  return (
    <StevenTableContainer sx={{ maxWidth: 900, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
        Sharp Report
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1, textAlign: "center" }}>
        Picks where the line at submission was more valuable than the closing line (CLV &ge; 3).
      </Typography>

      <Box sx={{ px: 2, pb: 2 }}>
        <FormLabel>Season</FormLabel>
        <StevenSelect
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          options={seasonOptions.map((s) => ({ value: s, label: s }))}
        />
      </Box>

      <StevenTableContainer sx={{ margin: "0 16px 16px 16px" }}>
        <StevenTable>
          <StevenTableHead>
            <StevenTableRow>
              <StevenTableCell sx={{ fontWeight: 700 }}>Wk</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Player</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Pick</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Pick Line</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Closing</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>CLV</StevenTableCell>
            </StevenTableRow>
          </StevenTableHead>
          <StevenTableBody>
            {rows.length === 0 ? (
              <StevenTableRow>
                <StevenTableCell colSpan={6} sx={{ textAlign: "center", color: "text.secondary" }}>
                  No sharp picks found.
                </StevenTableCell>
              </StevenTableRow>
            ) : (
              rows.map((row, i) => (
                <StevenTableRow key={i}>
                  <StevenTableCell>{row.week}</StevenTableCell>
                  <StevenTableCell>{row.displayName}</StevenTableCell>
                  <StevenTableCell>{row.text}</StevenTableCell>
                  <StevenTableCell>{formatLine(row.type, row.pickValue)}</StevenTableCell>
                  <StevenTableCell>{formatLine(row.type, row.closingLine)}</StevenTableCell>
                  <StevenTableCell>
                    <Chip
                      label={`+${row.clv}`}
                      color={CLV_CHIP_COLOR(row.clv)}
                      size="small"
                    />
                  </StevenTableCell>
                </StevenTableRow>
              ))
            )}
          </StevenTableBody>
        </StevenTable>
      </StevenTableContainer>
    </StevenTableContainer>
  );
};

export default SharpReport;
