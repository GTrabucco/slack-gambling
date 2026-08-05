import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import TablePagination from "@mui/material/TablePagination";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { BsCheckCircle, BsCheckCircleFill } from "react-icons/bs";
import StevenButton from "../../Common/StevenButton";
import apiClient from "../../../services/apiClient";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../../Common/StevenTable";

const TEXT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const ViewLogs = () => {
    const [error, setError] = useState("");
    const [logs, setLogs] = useState([]);
    const [textHistory, setTextHistory] = useState([]);
    const [textPage, setTextPage] = useState(0);
    const [textRowsPerPage, setTextRowsPerPage] = useState(25);

    const fetchAll = async () => {
        try {
            const [cronRes, textRes] = await Promise.all([
                apiClient.get("/api/cron-logs"),
                apiClient.get("/api/text-history"),
            ]);
            setLogs(cronRes.data || []);
            setTextHistory(textRes.data || []);
            setError("");
        } catch (e) {
            console.error("Error fetching logs:", e);
            setError("Error fetching logs");
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const markAsRead = async (id) => {
        try {
            const res = await apiClient.put(`/api/cron-logs/${id}/read`);
            setLogs(prev => prev.map(l => l._id === id ? { ...l, read: res.data.read } : l));
        } catch (e) {
            setError("Error toggling log read status");
        }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Typography variant="h5">Logs</Typography>
                <StevenButton size="small" onClick={fetchAll}>Refresh</StevenButton>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Cron Logs */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Cron Job Logs</Typography>
            <StevenTableContainer>
                <StevenTable>
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell>Timestamp</StevenTableCell>
                            <StevenTableCell>Job</StevenTableCell>
                            <StevenTableCell>Status</StevenTableCell>
                            <StevenTableCell>Message</StevenTableCell>
                            <StevenTableCell></StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <StevenTableRow key={log._id} sx={log.status === 'error' && !log.read ? { bgcolor: "rgba(211,47,47,0.08)" } : {}}>
                                    <StevenTableCell>{new Date(log.timestamp).toLocaleString()}</StevenTableCell>
                                    <StevenTableCell>{log.jobName}</StevenTableCell>
                                    <StevenTableCell>
                                        <Chip label={log.status} color={log.status === 'success' ? 'success' : 'error'} size="small" />
                                    </StevenTableCell>
                                    <StevenTableCell sx={{ whiteSpace: "normal", wordBreak: "break-word", minWidth: 200 }}>{log.message}</StevenTableCell>
                                    <StevenTableCell>
                                        {log.status === 'error' && (
                                            <Tooltip title={log.read ? "Mark as unread" : "Mark as read"}>
                                                <IconButton size="small" onClick={() => markAsRead(log._id)} sx={{ color: log.read ? "success.main" : "inherit" }}>
                                                    {log.read ? <BsCheckCircleFill /> : <BsCheckCircle />}
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </StevenTableCell>
                                </StevenTableRow>
                            ))
                        ) : (
                            <StevenTableRow>
                                <StevenTableCell colSpan={5}>No cron logs available.</StevenTableCell>
                            </StevenTableRow>
                        )}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>

            <Divider sx={{ my: 3 }} />

            {/* Text History */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Sunday Reminder Text History</Typography>
            <StevenTableContainer>
                <StevenTable>
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell>Date</StevenTableCell>
                            <StevenTableCell>Username</StevenTableCell>
                            <StevenTableCell>Phone Number</StevenTableCell>
                            <StevenTableCell>Status</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                        {textHistory.length > 0 ? (
                            textHistory
                                .slice(textPage * textRowsPerPage, textPage * textRowsPerPage + textRowsPerPage)
                                .map((entry) => (
                                    <StevenTableRow key={entry._id}>
                                        <StevenTableCell>{new Date(entry.Date).toLocaleString()}</StevenTableCell>
                                        <StevenTableCell>{entry.Username || "—"}</StevenTableCell>
                                        <StevenTableCell>{entry.Number}</StevenTableCell>
                                        <StevenTableCell>
                                            <Chip label={entry.Status} color={entry.Status === 'Success' ? 'success' : 'error'} size="small" />
                                        </StevenTableCell>
                                    </StevenTableRow>
                                ))
                        ) : (
                            <StevenTableRow>
                                <StevenTableCell colSpan={4}>No text history available.</StevenTableCell>
                            </StevenTableRow>
                        )}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
            <TablePagination
                component="div"
                count={textHistory.length}
                page={textPage}
                onPageChange={(_, newPage) => setTextPage(newPage)}
                rowsPerPage={textRowsPerPage}
                onRowsPerPageChange={(e) => { setTextRowsPerPage(parseInt(e.target.value, 10)); setTextPage(0); }}
                rowsPerPageOptions={TEXT_ROWS_PER_PAGE_OPTIONS}
            />
        </Box>
    );
};

export default ViewLogs;
