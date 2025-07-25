import React, { useState } from "react";
import { Navbar, Nav, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LogoutButton } from "../Common/logout.button";
import { useAuth0 } from "@auth0/auth0-react";
import {
    BsClockHistory, BsBug, BsCalculator, BsCardChecklist,
    BsPersonCircle, BsHouseDoor
} from "react-icons/bs";
import { IoLogOutOutline, IoPodiumOutline } from "react-icons/io5";
import { ImStatsDots } from "react-icons/im";
import { GiRunningNinja } from "react-icons/gi";
import './style.css';

const StevenNavbar = () => {
    const { user } = useAuth0();
    const [show, setShow] = useState(false);
    const isAdmin = user.email.toLowerCase() === 'giulian.trabucco@gmail.com'
    const handleShow = (e) => {
        setShow(true);
        e.currentTarget.blur();
    };
    const handleClose = () => setShow(false);
    const navigate = useNavigate();

    const handleNavigate = (path) => {
        navigate(path);
        setShow(false);
    };

    const menuLinks = [
        { path: "/dashboard", label: "Home", icon: <BsHouseDoor /> },
        { path: "/standings", label: "Standings", icon: <IoPodiumOutline /> },
        { path: "/pickhistory", label: "History", icon: <BsClockHistory /> },
        { path: "/statistics", label: "Statistics", icon: <ImStatsDots /> },
        { path: "/reportissue", label: "Report Issue", icon: <BsBug /> },
        ...(isAdmin ? [
            { path: "/calculatescoring", label: "Calculate Scoring", icon: <BsCalculator /> },
            { path: "/viewReports", label: "Reports", icon: <BsCardChecklist /> },
            { path: "/jobrunner", label: "Job Runner", icon: <GiRunningNinja /> },
        ] : []),
        { path: "/account", label: "Account", icon: <BsPersonCircle /> },
    ];

    return (
        <>
            <Navbar className="bg-body-tertiary" expand="lg">
                <Navbar.Brand style={{ cursor: "pointer" }}>
                    <Button onClick={(e) => handleShow(e)} className="accordian" style={{ marginLeft: 15 }}>
                        <img src="/menu.svg" alt="Menu" style={{ width: '45px', height: '24px' }} />
                    </Button>
                    <a className="navbar-brand text-body-secondary" href="/">
                        <img alt="" className="spin" width="45" height="45" src="/stevenlogo.png" style={{ marginLeft: 15 }} />
                        <span style={{ fontFamily: "Segoe UI", fontWeight: 400, fontSize: 18, marginLeft: 10 }}>Slack Gambling</span>
                    </a>
                </Navbar.Brand>
            </Navbar>

            {show && <div className="custom-backdrop" onClick={handleClose}></div>}

            <div className={`custom-offcanvas ${show ? "show" : ""}`}>
                <Nav className="flex-column">
                    {menuLinks.map(
                        (link) =>
                            (link.show === undefined || link.show) && (
                                <Nav.Link
                                    className="menu-links"
                                    key={link.path}
                                    onClick={() => handleNavigate(link.path)}
                                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                                >
                                    {link.icon} {link.label}
                                </Nav.Link>
                            )
                    )}
                    <Nav.Link as="div" className="menu-links" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <IoLogOutOutline />
                        <LogoutButton />
                    </Nav.Link>
                </Nav>
            </div>
        </>
    );
};

export default StevenNavbar;
