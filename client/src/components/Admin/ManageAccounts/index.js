import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import { BsPencil, BsTrash, BsCheck, BsX } from "react-icons/bs";
import StevenButton from "../../Common/StevenButton";
import userService from "../../../services/userService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../../Common/StevenTable";

const EMPTY_FORM = { username: "", displayName: "", phoneNumber: "", receiveSundayReminder: false, hasPaid: false };

const ManageAccounts = () => {
    const [users, setUsers] = useState([]);
    const [editingUsername, setEditingUsername] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newForm, setNewForm] = useState(EMPTY_FORM);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchUsers = async () => {
        try {
            const res = await userService.getAllUsers();
            setUsers((res.data || []).sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username)));
        } catch (e) {
            setError("Error fetching users");
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleEdit = (user) => {
        setEditingUsername(user.username);
        setEditForm({
            username: user.username,
            displayName: user.displayName || "",
            phoneNumber: user.phoneNumber || "",
            receiveSundayReminder: !!user.receiveSundayReminder,
            hasPaid: !!user.hasPaid,
        });
    };

    const handleCancelEdit = () => {
        setEditingUsername(null);
        setEditForm({});
    };

    const handleSaveEdit = async () => {
        try {
            await userService.updateUserDetails({
                username: editForm.username,
                displayName: editForm.displayName,
                phoneNumber: editForm.phoneNumber,
                receiveSundayReminder: editForm.receiveSundayReminder,
                hasPaid: editForm.hasPaid,
            });
            setSuccess(`${editForm.displayName || editForm.username} updated.`);
            setEditingUsername(null);
            setEditForm({});
            fetchUsers();
        } catch (e) {
            setError("Error saving user");
        }
    };

    const handleDelete = async (username) => {
        if (!window.confirm(`Delete account for ${username}? This cannot be undone.`)) return;
        try {
            await userService.deleteUser(username);
            setSuccess(`${username} deleted.`);
            fetchUsers();
        } catch (e) {
            setError("Error deleting user");
        }
    };

    const handleCreateUser = async () => {
        if (!newForm.username) { setError("Username is required."); return; }
        try {
            await userService.updateUserDetails({
                username: newForm.username,
                displayName: newForm.displayName,
                phoneNumber: newForm.phoneNumber,
                receiveSundayReminder: newForm.receiveSundayReminder,
                hasPaid: newForm.hasPaid,
            });
            setSuccess(`Account created for ${newForm.displayName || newForm.username}.`);
            setNewForm(EMPTY_FORM);
            setError("");
            fetchUsers();
        } catch (e) {
            setError("Error creating user");
        }
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Manage Accounts</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Create User Form */}
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 3, mb: 3, bgcolor: "background.paper" }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Create Account</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField label="Username (email)" value={newForm.username} onChange={e => setNewForm(p => ({ ...p, username: e.target.value }))} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField label="Display Name" value={newForm.displayName} onChange={e => setNewForm(p => ({ ...p, displayName: e.target.value }))} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField label="Phone Number" value={newForm.phoneNumber} onChange={e => setNewForm(p => ({ ...p, phoneNumber: e.target.value }))} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Switch checked={newForm.receiveSundayReminder} onChange={e => setNewForm(p => ({ ...p, receiveSundayReminder: e.target.checked }))} size="small" />
                            <Typography variant="body2">Sunday Reminder</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Switch checked={newForm.hasPaid} onChange={e => setNewForm(p => ({ ...p, hasPaid: e.target.checked }))} size="small" />
                            <Typography variant="body2">Has Paid</Typography>
                        </Box>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                    <StevenButton onClick={handleCreateUser}>Create Account</StevenButton>
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Users Table */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{users.length} account{users.length !== 1 ? 's' : ''}</Typography>
            <StevenTableContainer>
                <StevenTable>
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell>Username</StevenTableCell>
                            <StevenTableCell>Display Name</StevenTableCell>
                            <StevenTableCell>Phone</StevenTableCell>
                            <StevenTableCell>Sunday Reminder</StevenTableCell>
                            <StevenTableCell>Paid</StevenTableCell>
                            <StevenTableCell>Actions</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                        {users.length > 0 ? users.map(user => (
                            <StevenTableRow key={user.username}>
                                <StevenTableCell>{user.username.split("@")[0]}</StevenTableCell>

                                {editingUsername === user.username ? (
                                    <>
                                        <StevenTableCell>
                                            <TextField value={editForm.displayName} onChange={e => setEditForm(p => ({ ...p, displayName: e.target.value }))} size="small" sx={{ width: 140 }} />
                                        </StevenTableCell>
                                        <StevenTableCell>
                                            <TextField value={editForm.phoneNumber} onChange={e => setEditForm(p => ({ ...p, phoneNumber: e.target.value }))} size="small" sx={{ width: 140 }} />
                                        </StevenTableCell>
                                        <StevenTableCell>
                                            <Switch checked={editForm.receiveSundayReminder} onChange={e => setEditForm(p => ({ ...p, receiveSundayReminder: e.target.checked }))} size="small" />
                                        </StevenTableCell>
                                        <StevenTableCell>
                                            <Switch checked={editForm.hasPaid} onChange={e => setEditForm(p => ({ ...p, hasPaid: e.target.checked }))} size="small" />
                                        </StevenTableCell>
                                        <StevenTableCell>
                                            <Tooltip title="Save">
                                                <IconButton size="small" onClick={handleSaveEdit}><BsCheck /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Cancel">
                                                <IconButton size="small" onClick={handleCancelEdit}><BsX /></IconButton>
                                            </Tooltip>
                                        </StevenTableCell>
                                    </>
                                ) : (
                                    <>
                                        <StevenTableCell>{user.displayName || "—"}</StevenTableCell>
                                        <StevenTableCell>{user.phoneNumber || "—"}</StevenTableCell>
                                        <StevenTableCell>
                                            <Chip label={user.receiveSundayReminder ? "Yes" : "No"} color={user.receiveSundayReminder ? "success" : "default"} size="small" />
                                        </StevenTableCell>
                                        <StevenTableCell>
                                            <Chip label={user.hasPaid ? "Paid" : "Unpaid"} color={user.hasPaid ? "success" : "error"} size="small" />
                                        </StevenTableCell>
                                        <StevenTableCell>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleEdit(user)}><BsPencil /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(user.username)}><BsTrash /></IconButton>
                                            </Tooltip>
                                        </StevenTableCell>
                                    </>
                                )}
                            </StevenTableRow>
                        )) : (
                            <StevenTableRow>
                                <StevenTableCell colSpan={6}>No accounts found.</StevenTableCell>
                            </StevenTableRow>
                        )}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
        </Box>
    );
};

export default ManageAccounts;
