import React from "react";
import { useAuth } from "../../hooks/AuthProvider";
import StevenNavbar from "../StevenNavbar";
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const Dashboard = () => {
  const auth = useAuth();
  return (
    <Container>
        <h1>Dashboard</h1>
    </Container>       
);
};

export default Dashboard;