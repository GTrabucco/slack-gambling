import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import "./style.css";
import { LoginButton } from "../Common/login-button";
import { SignupButton } from "../Common/signup-button";

const Login = () => {
  return (
    <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "grey.100" }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4">Slack Gambling</Typography>
        <LoginButton />
        <SignupButton />
      </Stack>
    </Box>
  );
};

export default Login;
