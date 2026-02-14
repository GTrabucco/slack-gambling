import { useState } from 'react';
import { Form, Container, Alert } from 'react-bootstrap';
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
    <Container className="mt-4">
      <h2>Report an Issue</h2>
      {submitted && (
        <Alert variant="success">
          Thank you for reporting the issue!
        </Alert>
      )}
      {!submitted && (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="issueDescription">
            <Form.Control 
              as="textarea" 
              rows={3} 
              placeholder="Describe the issue..." 
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              required
            />
          </Form.Group>
          <StevenButton type="submit">
            Submit
          </StevenButton>
        </Form>
      )}
    </Container>
  );
};

export default ReportIssue;
