import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import "./style.css";
import { LoginButton } from "../Common/login-button";
import { SignupButton } from "../Common/signup-button";

const Login = () => {
  return (
    <Box sx={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "background.default"
    }}>
      <Box sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        p: 5,
        width: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
      }}>
        <Stack alignItems="center" spacing={1}>
          <img src="/stevenlogo.png" alt="Slack Gambling" width={64} height={64} />
          <Typography variant="h5" fontWeight={600}>Slack Gambling</Typography>
          <Typography variant="body2" color="text.secondary">Sign in to make your picks</Typography>
        </Stack>
        <Divider flexItem />
        <Stack spacing={1.5} width="100%">
          <LoginButton />
          <SignupButton />
        </Stack>
      </Box>
    </Box>
  );
};

export default Login;
