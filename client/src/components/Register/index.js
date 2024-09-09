import { useState } from "react";
import { useAuth } from "../../hooks/AuthProvider";
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [creds, setCreds] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    if (creds.username !== "" && creds.password !== "") {
      try {
        let response = await axios.post(`${auth.apiBaseUrl}/api/register`, creds);
        if (response.data) {
            if (response.data.error){
                setError(response.data.error)
            } else {
                navigate("/login");
            }
        }
      } catch (err) {
        setError(err.message);
      }
      return;
    }
    setError("Please provide a valid input");
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setCreds((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
          <Form onSubmit={handleSubmitEvent} className="w-75 mx-auto">
            {error && (
              <Alert variant="danger">
                {error}
              </Alert>
            )}
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                placeholder="Enter username"
                onChange={handleInput}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Password (HEADS UP! I CAN SEE ALL PASSWORDS SO DON'T USE A REAL ONE!)</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Enter password"
                aria-describedby="user-password"
                aria-invalid="false"
                onChange={handleInput}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 mb-3">
              Submit
            </Button>
            
            <Button variant="primary" className="w-100" onClick={()=>navigate("/login")}>
              Back To Login
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
