import { useState } from "react";
import { Container, Row, Col, Form } from 'react-bootstrap';
import "./style.css";
import { LoginButton } from "../Buttons/login-button";
import { SignupButton } from "../Buttons/signup-button";

const Login = () => {
  const [error, setError] = useState("");

  return (
    <Container fluid className="p-0" style={{ height: '100vh' }}>
      <Row className="no-gutters h-100">
        <Col md={8} className="d-none d-md-block p-0">
          <img
            src="stevenlogo.png"
            alt="Steven"
            className="w-100 h-100 object-fit-cover"
          />
        </Col>
        <Col md={4} className="d-flex align-items-center justify-content-center bg-light">
          <div className="d-flex flex-column">
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
