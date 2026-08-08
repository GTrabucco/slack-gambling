import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import StevenButton from "../../Common/StevenButton";
import apiClient from "../../../services/apiClient";
import userService from "../../../services/userService";
import { useEffect } from "react";

const BroadcastText = () => {
    const [message, setMessage] = useState("");
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState({});
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await userService.getAllUsers();
                const withPhone = (res.data || []).filter(u => u.phoneNumber);
                setUsers(withPhone);
                setSelected({});
            } catch {
                setError("Failed to load users.");
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    const allChecked = users.length > 0 && users.every(u => selected[u.username]);
    const someChecked = users.some(u => selected[u.username]);

    const toggleAll = () => {
        const next = !allChecked;
        const updated = {};
        for (const u of users) updated[u.username] = next;
        setSelected(updated);
    };

    const toggle = (username) =>
        setSelected(prev => ({ ...prev, [username]: !prev[username] }));

    const handleSend = async () => {
        setResult(null);
        setError("");
        setLoading(true);
        const phoneNumbers = users
            .filter(u => selected[u.username])
            .map(u => u.phoneNumber);
        try {
            const res = await apiClient.post("/api/broadcast", { message, phoneNumbers });
            setResult(res.data);
            setMessage("");
        } catch (e) {
            setError(e.response?.data?.error || "Failed to send broadcast.");
        } finally {
            setLoading(false);
        }
    };

    const selectedCount = users.filter(u => selected[u.username]).length;

    return (
        <Box>
            <Stack spacing={2}>
                <Typography variant="h5">Broadcast Text Message</Typography>
                <Typography variant="body2" color="text.secondary">
                    Send a custom SMS to selected users.
                </Typography>
                {error && <Alert severity="error">{error}</Alert>}
                {result && (
                    <Alert severity="success">
                        Sent: {result.sent} succeeded, {result.failed} failed.
                    </Alert>
                )}
                <TextField
                    label="Message"
                    multiline
                    minRows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    inputProps={{ maxLength: 500 }}
                    helperText={`${message.length}/500`}
                    fullWidth
                />
                <Divider />
                <Typography variant="subtitle2">
                    Recipients ({selectedCount}/{users.length})
                </Typography>
                {loadingUsers ? <CircularProgress size={24} /> : (
                    <Box>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={allChecked}
                                    indeterminate={someChecked && !allChecked}
                                    onChange={toggleAll}
                                />
                            }
                            label={<Typography fontWeight={700}>Select All</Typography>}
                        />
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                            {users
                                .sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username))
                                .map(u => (
                                    <Box key={u.username} sx={{ width: "50%" }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={!!selected[u.username]}
                                                    onChange={() => toggle(u.username)}
                                                />
                                            }
                                            label={u.displayName || u.username}
                                        />
                                    </Box>
                                ))}
                        </Box>
                    </Box>
                )}
                <Box>
                    <StevenButton
                        onClick={handleSend}
                        disabled={loading || !message.trim() || selectedCount === 0}
                    >
                        {loading ? "Sending..." : `Send to ${selectedCount} user${selectedCount !== 1 ? "s" : ""}`}
                    </StevenButton>
                </Box>
            </Stack>
        </Box>
    );
};

export default BroadcastText;

