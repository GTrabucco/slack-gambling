import { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import { useAuth0 } from "@auth0/auth0-react";
import StevenNotification from "../StevenNotification";
import './style.css'
import StevenButton from "../Common/StevenButton";
import userService from "../../services/userService";

const UserAccount = () => {
    const { user } = useAuth0();
    const [message, setMessage] = useState();
    const [displayName, setDisplayName] = useState("");
    const [receiveSundayReminderChecked, setReceiveSundayReminderChecked] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await userService.getByUsername(user.name);
                const details = response.data[0];
                if (!details) {
                    setDisplayName(user.name);
                    setReceiveSundayReminderChecked(false);
                    setPhoneNumber("");
                    return;
                }

                setReceiveSundayReminderChecked(!!details.receiveSundayReminder);
                setDisplayName(details.displayName || user.name);
                setPhoneNumber(details.phoneNumber || "");
            } catch (error) {
                setMessage('Error fetching user details');
            }
        };

        fetchUserDetails();
    }, [user.name]);

    const updateUserDetails = async () => {
        try {
            const username = user.name;
            await userService.updateUserDetails({
                username: username,
                displayName: displayName?.trim() ? displayName.trim() : user.name,
                receiveSundayReminder: receiveSundayReminderChecked,
                phoneNumber: phoneNumber
            });
            setMessage('Updated User Details');
        } catch (error) {
            setMessage('Error updating user details');
        }
    };

    return (
        <Container sx={{ mt: 4 }}>
            <StevenNotification message={message} setMessage={setMessage} />

            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                    component="form"
                    className="ua-panel"
                    onSubmit={(e) => {
                        e.preventDefault();
                        updateUserDetails();
                    }}
                    sx={{ width: "100%", maxWidth: 600 }}
                >
                    <div className="ua-header">
                        <Typography variant="h6">Account Settings</Typography>
                        <Typography variant="body2">Manage your display name and reminder preferences.</Typography>
                    </div>

                    <Stack spacing={2} className="ua-section">
                        <TextField
                            id="displayName"
                            label="Display Name"
                            fullWidth
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder={user.name}
                            size="small"
                            helperText="This is shown on standings and pick history."
                        />
                    </Stack>

                    <div className="ua-section">
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Email</Typography>
                        <div className="ua-readonly">{user.email}</div>
                    </div>

                    <div className="ua-section">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={receiveSundayReminderChecked}
                                    onChange={() => setReceiveSundayReminderChecked(!receiveSundayReminderChecked)}
                                />
                            }
                            label="Receive Sunday 9:00 AM ET reminder"
                        />
                        {receiveSundayReminderChecked && (
                            <TextField
                                id="phoneNumber"
                                label="Phone Number"
                                type="tel"
                                fullWidth
                                placeholder="e.g. 123-456-7890"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                size="small"
                                sx={{ mt: 1.5 }}
                            />
                        )}
                    </div>

                    <div className="ua-actions">
                        <StevenButton type="submit">Save Changes</StevenButton>
                    </div>
                </Box>
            </Box>
        </Container>
    );
};

export default UserAccount;
