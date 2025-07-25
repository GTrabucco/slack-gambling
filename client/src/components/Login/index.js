import { useState } from "react";
import { Container, Row, Col, Form } from 'react-bootstrap';
import "./style.css";
import { LoginButton } from "../Common/login-button";
import { SignupButton } from "../Common/signup-button";

const Login = () => {
  const [error, setError] = useState("");

  return (
    <Container fluid className="p-0" style={{ height: '100vh' }}>
      <Row className="no-gutters h-100">
        <Col md={4} className="d-flex align-items-center justify-content-center bg-light" style={{width: "100%"}}>
          <div className="d-flex flex-column">
            <Row className="mb-4">
              <h2>Slack Gambling</h2>
            </Row>
            <Row className="mb-4">
              <LoginButton />
            </Row> 
            <Row>
              <SignupButton />
            </Row>             
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
