import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import StevenButton from "../Common/StevenButton";
import userService from "../../services/userService";

const StevenPayPopup = ({ showVenmo, setShowVenmo, setMessage, user }) => {
    const handleCloseVenmo = async (status) => {
        if (status) {
            await updateHasPaid()
        }

        setShowVenmo(false);
    };

    const updateHasPaid = async () => {
        try {
            const username = user.name;
            await userService.markHasPaid(username);
        } catch (error) {
            setMessage('Error updating user details has paid');
        }
    };

    return (
        <Dialog open={showVenmo} onClose={() => handleCloseVenmo()} maxWidth="sm" fullWidth>
            <DialogTitle>
                $105 Buy In Must Be Paid Before Start of Week 1 Games
            </DialogTitle>
            <DialogContent dividers>
                <Typography gutterBottom>
                    <a
                        href="https://venmo.com/u/Giulian-Trabucco?txn=pay&amount=105&note=Slack Pool"
                        style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}
                    >
                        <img className="medal" src="venmo.png" alt="Venmo" />
                        <span>Venmo</span>
                    </a>
                </Typography>
                <br />
                <Typography gutterBottom>
                    <a
                        href="https://cash.app/$GiulianTrabucco/105"
                        style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}
                    >
                        <img className="medal" src="cashapp.webp" alt="Cash App" />
                        <span>Cash App</span>
                    </a>
                </Typography>
            </DialogContent>
            <DialogActions>
                <StevenButton onClick={() => handleCloseVenmo(true)}>
                    I have paid the buy in
                </StevenButton>
                <StevenButton onClick={() => handleCloseVenmo(false)}>
                    I plan on paying soon
                </StevenButton>
            </DialogActions>
        </Dialog>
    );
};

export default StevenPayPopup;
