import { useState } from "react";
import { useAuth } from "../../hooks/AuthProvider";
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import "./style.css";

const Login = () => {
  const [creds, setCreds] = useState({
    username: "",
    password: "",
  });

  const auth = useAuth();
  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (creds.username !== "" && creds.password !== "") {
      auth.loginAction(creds);
      return;
    }
    alert("pleae provide a valid input");
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setCreds((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
      <Container fluid style={{ overflow: 'hidden' }}>
        <Row className="no-gutters" style={{ height: '100vh', overflow: 'hidden' }}>
          <Col md={8} style={{ padding: 0, height: '100%' }}>
            <img
              src="stevenlogo.png"
              alt="Steven"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Col>
          <Col md={4} className="d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa', height: '100vh' }} >
            <Form onSubmit={handleSubmitEvent}>
              <Form.Group className="mb-3" controlId="formUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  placeholder="Enter username"
                  onChange={handleInput}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  aria-describedby="user-password"
                  aria-invalid="false"
                  onChange={handleInput}
                />
              </Form.Group>

              <Button variant="primary" type="submit" style={{width: "100%"}}>
                Login
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
  );
};

export default Login;