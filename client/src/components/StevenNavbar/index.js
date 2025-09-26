import { useState } from "react";
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import './style.css';
import StevenButton from "../Common/StevenButton";

const StevenNavbar = () => {
    const { user } = useAuth0();
    const [show, setShow] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const handleShowRules = () => {
        setShowRules(true);
    };

    const handleCloseRules = () => {
        setShowRules(false);
    };

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
            { path: "/viewReports", label: "Issues", icon: <BsCardChecklist /> },
            { path: "/jobrunner", label: "Job Runner", icon: <GiRunningNinja /> },
        ] : []),
        { path: "/account", label: "Account", icon: <BsPersonCircle /> },
    ];

    return (
        <>
            <Dialog open={showRules} onClose={() => handleCloseRules()} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Slack Gambling Rules
                </DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>
                        <b>1.</b> Games update on <b>Tuesdays</b> and <b>Fridays</b>. You'll see games from <b>Tue-Thu</b> during the week, and <b>Fri-Mon</b> over the weekend.
                    </Typography>
                    <Typography gutterBottom>
                        <b>2.</b> Pick a Favorite, Underdog, Over and Under each week
                    </Typography>
                    <Typography gutterBottom>
                        <b>3.</b> Submit picks using the button at the bottom of the page
                    </Typography>
                    <Typography gutterBottom>
                        <b>4.</b> Picks can be changed until the game starts
                    </Typography>
                    <Typography gutterBottom>
                        <b>5.</b> Scoring: +1 for correct, -1 for incorrect, 0 for push
                    </Typography>
                    <Typography gutterBottom>
                        <b>6.</b> Earn 1 share in the Perfect Week Pool by going 4/4 in a week. The pool payout is split among all shareholders at season's end
                    </Typography>
                    <Typography gutterBottom>
                        <b>7.</b> Enable text reminders and edit your display name on the Account page
                    </Typography>
                    <Typography gutterBottom>
                        <b>8.</b> Submit questions or issues via the Report Issue page
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <StevenButton onClick={handleCloseRules}>
                        Close
                    </StevenButton>
                </DialogActions>
            </Dialog>
            <Navbar className="bg-body-tertiary" expand="lg">
                <Navbar.Brand style={{ cursor: "pointer" }}>
                    <Button onClick={(e) => handleShow(e)} className="accordian" style={{ marginLeft: 15 }}>
                        <img src="/menu.svg" alt="Menu" style={{ width: '45px', height: '24px' }} />
                    </Button>
                    <a className="navbar-brand text-body-secondary" href="/">
                        <img alt="" className="spin" width="45" height="45" src="/stevenlogo.png" style={{ marginLeft: 15 }} />
                        <span style={{ fontWeight: 400, fontSize: 18, marginLeft: 10 }}>Slack Gambling</span>
                    </a>
                    <span
                        onClick={handleShowRules}
                        style={{
                            marginLeft: 10,
                            fontSize: "0.85rem",
                            textDecoration: "underline",
                            cursor: "pointer",
                            color: "#6c757d"
                        }}
                    >
                        Rules
                    </span>
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
