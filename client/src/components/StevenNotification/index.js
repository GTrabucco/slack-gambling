import { useEffect, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const StevenNotification = ({ message, setMessage, type }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (message) setOpen(true);
    }, [message]);

    const handleClose = (_, reason) => {
        if (reason === "clickaway") return;
        setOpen(false);
        setMessage("");
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={3000}
            onClose={handleClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
            <Alert
                onClose={handleClose}
                severity={type === "error" ? "error" : "success"}
                variant="filled"
                sx={{ width: "100%" }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default StevenNotification;