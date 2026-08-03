import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell,
} from "../../Common/StevenTable";
import userService from "../../../services/userService";

const SundayReminderConfig = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState({});

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await userService.getAllUsers();
                setUsers(res.data || []);
            } catch (e) {
                setError("Failed to load users.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleToggle = async (user) => {
        const username = user.username;
        const newValue = !user.receiveSundayReminder;

        setUsers((prev) =>
            prev.map((u) =>
                u.username === username ? { ...u, receiveSundayReminder: newValue } : u
            )
        );
        setSaving((prev) => ({ ...prev, [username]: true }));

        try {
            await userService.updateUserDetails({
                username,
                receiveSundayReminder: newValue,
                displayName: user.displayName || "",
                phoneNumber: user.phoneNumber || "",
            });
        } catch (e) {
            setError(`Failed to update ${username}.`);
            // Revert on error
            setUsers((prev) =>
                prev.map((u) =>
                    u.username === username ? { ...u, receiveSundayReminder: !newValue } : u
                )
            );
        } finally {
            setSaving((prev) => ({ ...prev, [username]: false }));
        }
    };

    return (
        <Box>
            <Stack spacing={2}>
                <Typography variant="h5">Sunday Reminder Configuration</Typography>
                <Typography variant="body2" color="text.secondary">
                    Toggle which users receive the weekly Sunday text message reminder.
                </Typography>
                {error && <Alert severity="error">{error}</Alert>}
                {loading ? (
                    <CircularProgress />
                ) : (
                    <StevenTableContainer>
                        <StevenTable>
                            <StevenTableHead>
                                <StevenTableRow>
                                    <StevenTableCell>Username</StevenTableCell>
                                    <StevenTableCell>Display Name</StevenTableCell>
                                    <StevenTableCell>Phone Number</StevenTableCell>
                                    <StevenTableCell>Receives Reminder</StevenTableCell>
                                </StevenTableRow>
                            </StevenTableHead>
                            <StevenTableBody>
                                {users.length > 0 ? (
                                    users
                                        .sort((a, b) => (a.username || "").localeCompare(b.username || ""))
                                        .map((user) => (
                                            <StevenTableRow key={user._id || user.username}>
                                                <StevenTableCell>{user.username}</StevenTableCell>
                                                <StevenTableCell>{user.displayName || "—"}</StevenTableCell>
                                                <StevenTableCell>{user.phoneNumber || "—"}</StevenTableCell>
                                                <StevenTableCell>
                                                    <Switch
                                                        checked={!!user.receiveSundayReminder}
                                                        onChange={() => handleToggle(user)}
                                                        disabled={!!saving[user.username]}
                                                        color="primary"
                                                    />
                                                </StevenTableCell>
                                            </StevenTableRow>
                                        ))
                                ) : (
                                    <StevenTableRow>
                                        <StevenTableCell colSpan={4}>No users found.</StevenTableCell>
                                    </StevenTableRow>
                                )}
                            </StevenTableBody>
                        </StevenTable>
                    </StevenTableContainer>
                )}
            </Stack>
        </Box>
    );
};

export default SundayReminderConfig;
