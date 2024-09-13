import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const ReportIssue = () => {
  const [issueDescription, setIssueDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth0();
  const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const issueData = {
      username: user.name,
      description: issueDescription
    };

    try {
      await axios.post(`${apiBaseUrl}/api/report-issue`, issueData);
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
