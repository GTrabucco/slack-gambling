import React from "react";
import { Container, Navbar, NavDropdown, Nav } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { LogoutButton } from "../Buttons/logout.button";
import { useAuth0 } from "@auth0/auth0-react";

const StevenNavbar = () => {
    const {user } = useAuth0();
    const navigate = useNavigate();
    const text = `Signed in as: ${user.name}`;
    return (
        <Container>
            <Navbar className="bg-body-tertiary" expand="lg">
                <Container>
                    <Navbar.Brand onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
                        <img
                            src="stevenlogo.png"
                            width="30"
                            height="30"
                            className="d-inline-block align-top"
                            alt="Steven"
                        />
                    </Navbar.Brand>          
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                        <Navbar.Collapse id="basic-navbar-nav">
                            <Nav>
                                <Nav.Link onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>Dashboard</Nav.Link>
                                <Nav.Link onClick={() => navigate("/standings")} style={{ cursor: "pointer" }}>Standings</Nav.Link>
                                <Nav.Link onClick={() => navigate("/pickhistory")} style={{ cursor: "pointer" }}>Pick History</Nav.Link>
                                <Nav.Link onClick={() => navigate("/statistics")} style={{ cursor: "pointer" }}>Statistics</Nav.Link>
                                <Nav.Link onClick={() => navigate("/reportissue")} style={{ cursor: "pointer" }}>Report An Issue</Nav.Link>
                                {true && (
                                    <React.Fragment>
                                        <Nav.Link onClick={() => navigate("/calculatescoring")} style={{ cursor: "pointer" }}>
                                            Calculate Scoring
                                        </Nav.Link>
                                        <Nav.Link onClick={() => navigate("/viewReports")} style={{ cursor: "pointer" }}>
                                            View Reports
                                        </Nav.Link>
                                    </React.Fragment>                              
                                )}
                            </Nav>
                        </Navbar.Collapse>
                        <Navbar.Collapse className="justify-content-end">
                            <NavDropdown title={text}>
                                <NavDropdown.Item onClick={() => navigate("/account")} style={{ cursor: "pointer" }}>
                                    Account Details
                                </NavDropdown.Item>
                                <NavDropdown.Item >
                                    <LogoutButton />
                                </NavDropdown.Item>
                            </NavDropdown>
                        </Navbar.Collapse>
                </Container>
            </Navbar>
        </Container>
    );
}

export default StevenNavbar;
