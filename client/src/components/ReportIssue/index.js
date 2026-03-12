import { useState } from 'react';
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'react-router-dom';
import StevenButton from "../Common/StevenButton";
import issueService from "../../services/issueService";

const ReportIssue = () => {
  const location = useLocation();
  const { description } = location.state || {};
  const [issueDescription, setIssueDescription] = useState(description);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth0();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const issueData = {
      username: user.name,
      description: issueDescription
    };

    try {
      await issueService.reportIssue(issueData);
      setSubmitted(true); 
      setIssueDescription('');
    } catch (error) {
      console.error('Error reporting issue:', error);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Report an Issue</Typography>
      {submitted && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Thank you for reporting the issue!
        </Alert>
      )}
      {!submitted && (
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Describe the issue..."
            value={issueDescription || ""}
            onChange={(e) => setIssueDescription(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <StevenButton type="submit">Submit</StevenButton>
        </Box>
      )}
    </Container>
  );
};

export default ReportIssue;
