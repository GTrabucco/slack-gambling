import React, { useState } from "react";
import { Container, Navbar, Nav, Offcanvas, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LogoutButton } from "../Buttons/logout.button";
import { useAuth0 } from "@auth0/auth0-react";

const StevenNavbar = () => {
    const { user } = useAuth0();
    const [show, setShow] = useState(false);
    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);
    const navigate = useNavigate();

    const handleNavigate = (path) => {
        navigate(path);
        setShow(false);
    };

    const menuLinks = [
        { path: "/dashboard", label: "Dashboard" },
        //{ path: "/weekpicks", label: "Week Picks" },
        { path: "/standings", label: "Standings" },
        { path: "/pickhistory", label: "Pick History" },
        { path: "/statistics", label: "Statistics" },
        { path: "/reportissue", label: "Report An Issue" },
        { path: "/calculatescoring", label: "Calculate Scoring", show: true },
        { path: "/viewReports", label: "View Reports", show: true },
        { path: "/account", label: "Account Details" },
    ];

    return (
        <Container fluid>
            <Navbar className="bg-body-tertiary" expand="lg">
                <Container>
                    {/* Menu button for Offcanvas */}
                    <Navbar.Brand style={{ cursor: "pointer" }}>
                        <Button variant="primary" onClick={handleShow}>
                            ☰
                        </Button>
                    </Navbar.Brand>

                    <Navbar.Collapse id="responsive-navbar-nav" className="d-none d-lg-flex">
                        <Nav className="me-auto">
                            {menuLinks.map(
                                (link) =>
                                    (link.show === undefined || link.show) && (
                                        <Nav.Link
                                            key={link.path}
                                            onClick={() => handleNavigate(link.path)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {link.label}
                                        </Nav.Link>
                                    )
                            )}
                        </Nav>
                    </Navbar.Collapse>
                    <LogoutButton />
                </Container>
            </Navbar>

            <Offcanvas show={show} onHide={handleClose} backdrop="static">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Menu</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Nav className="flex-column">
                        {menuLinks.map(
                            (link) =>
                                (link.show === undefined || link.show) && (
                                    <Nav.Link
                                        key={link.path}
                                        onClick={() => handleNavigate(link.path)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {link.label}
                                    </Nav.Link>
                                )
                        )}
                    </Nav>
                </Offcanvas.Body>
            </Offcanvas>
        </Container>
    );
};

export default StevenNavbar;
