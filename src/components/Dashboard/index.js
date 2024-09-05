import React from "react";
import { useAuth } from "../../hooks/AuthProvider";
import { Container } from 'react-bootstrap';

const Dashboard = () => {
  const auth = useAuth();
  return (
    <Container>
        <h1>Dashboard</h1>
    </Container>       
);
};

export default Dashboard;