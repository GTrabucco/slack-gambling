import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { BsPencil, BsCheck, BsX } from "react-icons/bs";
import apiClient from "../../../services/apiClient";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell,
} from "../../Common/StevenTable";

const ManageTeamRecords = () => {
    const [teams, setTeams] = useState([]);
    const [editing, setEditing] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchTeams = async () => {
        try {
            const res = await apiClient.get("/api/records/all");
            setTeams(res.data || []);
        } catch {
            setError("Error fetching records");
        }
    };

    useEffect(() => { fetchTeams(); }, []);

    const handleEdit = (team) => {
        setEditing(team.team);
        setEditValue(team.record || "");
        setError("");
        setSuccess("");
    };

    const handleSave = async (teamName) => {
        try {
            await apiClient.put(`/api/records/${encodeURIComponent(teamName)}`, { record: editValue });
            setSuccess(`Saved record for ${teamName}`);
            setEditing(null);
            fetchTeams();
        } catch {
            setError("Error saving record");
        }
    };

    const handleCancel = () => {
        setEditing(null);
        setEditValue("");
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Manage Team Records</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Records are fetched from ESPN and updated every Tuesday. Use this to manually correct any record (format: W-L or W-L-T).
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <StevenTableContainer>
                <StevenTable>
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell>Team</StevenTableCell>
                            <StevenTableCell>Record</StevenTableCell>
                            <StevenTableCell>Last Updated</StevenTableCell>
                            <StevenTableCell>Edit</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                        {teams.map((team) => (
                            <StevenTableRow key={team.team}>
                                <StevenTableCell>{team.team}</StevenTableCell>
                                <StevenTableCell>
                                    {editing === team.team ? (
                                        <TextField
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            size="small"
                                            placeholder="e.g. 9-8"
                                            sx={{ width: 100 }}
                                            autoFocus
                                        />
                                    ) : (
                                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                            {team.record || "—"}
                                        </Typography>
                                    )}
                                </StevenTableCell>
                                <StevenTableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                                    {team.updatedAt ? new Date(team.updatedAt).toLocaleDateString() : "—"}
                                </StevenTableCell>
                                <StevenTableCell>
                                    {editing === team.team ? (
                                        <>
                                            <Tooltip title="Save">
                                                <IconButton size="small" onClick={() => handleSave(team.team)}>
                                                    <BsCheck />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Cancel">
                                                <IconButton size="small" onClick={handleCancel}>
                                                    <BsX />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    ) : (
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => handleEdit(team)}>
                                                <BsPencil />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </StevenTableCell>
                            </StevenTableRow>
                        ))}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
        </Box>
    );
};

export default ManageTeamRecords;
