import { useState } from "react";
import { useAuth } from "../../hooks/AuthProvider";
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Statistics = () => {
  const [error, setError] = useState("");
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <Container fluid className="p-0" style={{ height: '100vh' }}>
      <Row className="no-gutters h-100">
        <Col md={8} className="d-none d-md-block p-0">
          Statistics
        </Col>
      </Row>
    </Container>
  );
};

export default Statistics;
