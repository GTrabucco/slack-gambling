import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useAuth } from "../../hooks/AuthProvider";
import axios from 'axios';

const ReportIssue = () => {
  const [issueDescription, setIssueDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const auth = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const issueData = {
      username: auth.user?.username,
      description: issueDescription
    };

    try {
      await axios.post(`${auth.apiBaseUrl}/api/report-issue`, issueData);
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
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      )}
    </Container>
  );
};

export default ReportIssue;
