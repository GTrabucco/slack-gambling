import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import StevenGameInfo from "../StevenGameInfo";
import StevenButton from "../Common/StevenButton";
import gameService from "../../services/gameService";
import pickService from "../../services/pickService";
import apiClient from "../../services/apiClient";
const StevenGameList = ({ tempPicks,
    setMessage,
    gameStarted,
    setTempPicks,
    setError,
    user,
    selectedPicks,
    setSelectedPicks,
    getCommenceTimeByGameId,
    games,
    setGames
}) => {
    const [selectedGameId, setSelectedGameId] = useState()
    const [selectedGame, setSelectedGame] = useState(null)
    const [showStevenInfo, setShowStevenInfo] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [records, setRecords] = useState({})

    const fetchRecords = async () => {
        try {
            const res = await apiClient.get("/api/records");
            setRecords(res.data || {});
        } catch (_) {}
    };
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await gameService.getGames();
                setGames(response.data);
            } catch (error) {
                setError('Error fetching games');
            }
        };

        fetchGames();
        fetchPicks();
        fetchRecords();
    }, [])

    const fetchPicks = async () => {
        try {
            const response = await pickService.getWeeklyPicks(user.name);

            if (response.data != null) {
                setSelectedPicks(response.data);
                setTempPicks(response.data);
            }
        } catch (error) {
            setError('Error fetching picks');
        }
    };

    const submitPick = async (data) => {
        const { gameId, homeTeam, awayTeam, type, value, text } = data;
        try {
            const username = user.name;
            const data = { username, homeTeam, awayTeam, type, gameId, value, text }
            await pickService.submitPick(data);
        } catch (error) {
            const msg = error?.response?.data?.error || 'Error submitting pick';
            setError(msg);
            throw error;
        }
    }
    const submitPicks = async () => {
        const additions = tempPicks.filter(tempPick => {
            const existing = selectedPicks.find(p => p.type === tempPick.type);
            if (!existing) return true;
            return existing.gameId !== tempPick.gameId || existing.text !== tempPick.text;
        });
        const removals = selectedPicks.filter(existing =>
            !tempPicks.find(p => p.type === existing.type)
        );
        try {
            for (let pick of removals) {
                await pickService.removePick({ username: user.name, pickType: pick.type, gameId: pick.gameId, text: pick.text });
            }
            for (let pick of additions) {
                await submitPick(pick);
            }
            await fetchPicks();
            setShowConfirm(false);
            setMessage("Successfully Submitted Picks");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (_) {
            setShowConfirm(false);
        }
    }

    const isOpposite = (type) => {
        switch (type) {
            case "dog":
                return "favorite"
            case "favorite":
                return "dog"
            case "over":
                return "under"
            case "under":
                return "over"
            default:
                return false
        }
    }

    const updatePick = (gameId, homeTeam, awayTeam, type, value, text, commenceTime) => {
        if (gameStarted(commenceTime)) {
            setError("Game Already Started");
            return;
        }

        const existingPick = tempPicks.find(pick => pick.type === type);
        if (existingPick) {
            const existingPickCommenceTime = getCommenceTimeByGameId(existingPick.gameId);
            if (existingPickCommenceTime && gameStarted(existingPickCommenceTime)) {
                setError(`You already selected a ${type} in a game that has started`);
                return;
            }
        }

        if (type === "gotw") {
            setTempPicks(prevState => {
                const existingIndex = prevState.findIndex(pick => pick.type === "gotw");
                if (existingIndex !== -1 && prevState[existingIndex].text === text) {
                    return prevState.filter((_, i) => i !== existingIndex);
                }
                if (existingIndex !== -1) {
                    const newState = [...prevState];
                    newState[existingIndex] = { gameId, homeTeam, awayTeam, type, value, text };
                    return newState;
                }
                return [...prevState, { gameId, homeTeam, awayTeam, type, value, text }];
            });
            return;
        }

        const oppositePick = tempPicks.find(pick =>
            pick.type === isOpposite(type) &&
            (type === "over" || type === "under" ? true : pick.gameId === gameId)
        )
        if (oppositePick) {
            setTempPicks(prevState => {
                // Remove the opposite pick and upsert the new pick in one update
                const withoutOpposite = prevState.filter(
                    pick => !(pick.type === isOpposite(type) &&
                        (type === "over" || type === "under" ? true : pick.gameId === gameId))
                );
                const existingIndex = withoutOpposite.findIndex(pick => pick.type === type);
                if (existingIndex !== -1) {
                    const newState = [...withoutOpposite];
                    newState[existingIndex] = { gameId, homeTeam, awayTeam, type, value, text };
                    return newState;
                }
                return [...withoutOpposite, { gameId, homeTeam, awayTeam, type, value, text }];
            });
            return;
        }

        setTempPicks(prevState => {
            const existingIndex = prevState.findIndex(
                pick => pick.type === type
            );

            if (existingIndex !== -1 && prevState[existingIndex].gameId === gameId) {
                const newState = [...prevState];
                newState.splice(existingIndex, 1);
                return newState;
            }

            if (existingIndex !== -1) {
                const newState = [...prevState];
                newState[existingIndex] = { gameId, homeTeam, awayTeam, type, value, text };
                return newState;
            }

            return [...prevState, { gameId, homeTeam, awayTeam, type, value, text }];
        });
    };
    const gotwGameId = games.length > 0
        ? (games.find(g => g.isGotw)?.gameId ?? [...games].sort((a, b) => new Date(b["commence_time"]) - new Date(a["commence_time"]))[0]["gameId"])
        : null;

    // Build the ordered list: GOTW game first (as gotw), then all games in chronological order (GOTW game included as regular)
    const sortedGames = [...games].sort((a, b) => new Date(a["commence_time"]) - new Date(b["commence_time"]));
    const gotwGame = games.find(g => g["gameId"] === gotwGameId);
    const gameEntries = gotwGame
        ? [{ game: gotwGame, isGotw: true }, ...sortedGames.map(g => ({ game: g, isGotw: false }))]
        : sortedGames.map(g => ({ game: g, isGotw: false }));

    const pickTypeLabel = (type) => {
        switch (type) {
            case "favorite": return "Favorite";
            case "dog": return "Underdog";
            case "over": return "Over";
            case "under": return "Under";
            case "gotw": return "Game of the Week";
            default: return type;
        }
    };

    return (
        <>
            <StevenGameInfo
                showStevenInfo={showStevenInfo}
                selectedGameId={selectedGameId}
                setShowStevenInfo={setShowStevenInfo}
                homeTeam={selectedGame?.home}
                awayTeam={selectedGame?.away}
                homeSpread={selectedGame?.homeSpread}
                awaySpread={selectedGame?.awaySpread}
                over={selectedGame?.over}
            />

            {/* Confirmation Modal */}
            <Dialog open={showConfirm} onClose={() => setShowConfirm(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Your Picks</DialogTitle>
                <DialogContent dividers>
                    {tempPicks.length === 0 ? (
                        <Typography color="text.secondary">No picks selected.</Typography>
                    ) : (
                        <List disablePadding>
                            {["favorite", "dog", "over", "under", "gotw"].map((type) => {
                                const pick = tempPicks.find(p => p.type === type);
                                const isTotal = type === "over" || type === "under" ||
                                    (type === "gotw" && pick?.text?.includes("Over") || type === "gotw" && pick?.text?.includes("Under"));
                                const homeLogoName = pick ? `logos/${pick.homeTeam?.split(" ").pop()}.png` : null;
                                const awayLogoName = pick ? `logos/${pick.awayTeam?.split(" ").pop()}.png` : null;
                                // For spread picks, determine which team was picked from the text
                                const pickedTeamLogo = pick && !isTotal
                                    ? (() => {
                                        const homeLast = pick.homeTeam?.split(" ").pop();
                                        const awayLast = pick.awayTeam?.split(" ").pop();
                                        if (pick.text?.includes(pick.homeTeam)) return `logos/${homeLast}.png`;
                                        if (pick.text?.includes(pick.awayTeam)) return `logos/${awayLast}.png`;
                                        return null;
                                    })()
                                    : null;
                                return (
                                    <ListItem key={type} disablePadding sx={{ py: 0.75, gap: 1.5, alignItems: "center" }}>
                                        <Box sx={{ width: 64, flexShrink: 0, display: "flex", gap: 0.5, justifyContent: "center", alignItems: "center" }}>
                                            {pick && isTotal ? (
                                                <>
                                                    <img src={awayLogoName} alt="" width={28} height={28} style={{ objectFit: "contain" }} />
                                                    <img src={homeLogoName} alt="" width={28} height={28} style={{ objectFit: "contain" }} />
                                                </>
                                            ) : pick && pickedTeamLogo ? (
                                                <img src={pickedTeamLogo} alt="" width={32} height={32} style={{ objectFit: "contain" }} />
                                            ) : null}
                                        </Box>
                                        <ListItemText
                                            primary={pickTypeLabel(type)}
                                            secondary={pick ? pick.text : <em style={{ color: "#888" }}>No pick</em>}
                                            primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                                            secondaryTypographyProps={{ fontSize: 13 }}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </DialogContent>
                <DialogActions sx={{ gap: 1, px: 2, pb: 2 }}>
                    <StevenButton onClick={() => setShowConfirm(false)} sx={{ color: "gray", borderColor: "gray" }} variant="outlined">Cancel</StevenButton>
                    <StevenButton onClick={submitPicks} sx={{ backgroundColor: "white", color: "black", "&:hover": { backgroundColor: "#f0f0f0" } }}>Confirm</StevenButton>
                </DialogActions>
            </Dialog>

            <Box id="game-picks-form" sx={{ maxWidth: 600, mx: "auto" }}>
                {gameEntries
                        .map(({ game, isGotw }, entryIndex) => {
                            let home_team = game["home_team"];
                            let away_team = game["away_team"];
                            let home_spread = game["home_spread"]
                            let away_spread = game["away_spread"]

                            let home_team_name = home_team.split(" ").pop()
                            let away_team_name = away_team.split(" ").pop()

                            let home_logo = `logos/${home_team_name}.png`;
                            let away_logo = `logos/${away_team_name}.png`;

                            let over = game["over"]
                            let under = game["under"]
                            let commenceTime = game["commence_time"]
                            let favorite = +home_spread > +away_spread ? away_team + " " + away_spread : home_team + " " + home_spread
                            let underdog = +home_spread > +away_spread ? home_team + " +" + home_spread : away_team + " +" + away_spread
                            let favorite_spread = +home_spread > +away_spread ? +away_spread : +home_spread
                            let underdog_spread = +home_spread > +away_spread ? +home_spread : +away_spread

                            const gameIdStr = game["gameId"];
                            const away_picked = Array.isArray(tempPicks)
                                ? isGotw
                                    ? tempPicks.find(obj => obj.type === "gotw" && !obj.text.includes("Over") && !obj.text.includes("Under") && obj.text.includes(away_team_name))
                                    : tempPicks.find(obj => (obj.gameId === gameIdStr || (obj.text?.includes(away_team) && obj.text?.includes(home_team))) && obj.type === "dog" && obj.text.includes(away_team_name)) ||
                                      tempPicks.find(obj => (obj.gameId === gameIdStr || (obj.text?.includes(away_team) && obj.text?.includes(home_team))) && obj.type === "favorite" && obj.text.includes(away_team_name))
                                : null;
                            const home_picked = Array.isArray(tempPicks)
                                ? isGotw
                                    ? tempPicks.find(obj => obj.type === "gotw" && !obj.text.includes("Over") && !obj.text.includes("Under") && obj.text.includes(home_team_name))
                                    : tempPicks.find(obj => (obj.gameId === gameIdStr || (obj.text?.includes(away_team) && obj.text?.includes(home_team))) && obj.type === "dog" && obj.text.includes(home_team_name)) ||
                                      tempPicks.find(obj => (obj.gameId === gameIdStr || (obj.text?.includes(away_team) && obj.text?.includes(home_team))) && obj.type === "favorite" && obj.text.includes(home_team_name))
                                : null;
                            const over_picked = Array.isArray(tempPicks)
                                ? tempPicks.find(obj => obj.type === "over" && obj.text?.includes(home_team) && obj.text?.includes(away_team))
                                : null;
                            const under_picked = Array.isArray(tempPicks)
                                ? tempPicks.find(obj => obj.type === "under" && obj.text?.includes(home_team) && obj.text?.includes(away_team))
                                : null;

                            const dateObj = new Date(commenceTime);
                            return (
                                <Paper
                                    key={isGotw ? `gotw-${game["gameId"]}` : game["gameId"]}
                                    sx={{
                                        mb: 2.5,
                                        ...(isGotw && {
                                            border: "2px solid #D4AF37",
                                            boxShadow: "0 2px 16px rgba(212, 175, 55, 0.35)",
                                        })
                                    }}
                                    elevation={isGotw ? 4 : 2}
                                >
                                    {isGotw && (
                                        <Box sx={{
                                            background: "linear-gradient(90deg, #9a7c0a 0%, #D4AF37 40%, #F5CB5C 70%, #D4AF37 100%)",
                                            color: "#3d2b00",
                                            px: 1.5,
                                            py: 0.75,
                                            borderRadius: "2px 2px 0 0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 0.5,
                                        }}>
                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: "0.8rem", letterSpacing: "0.04em" }}>
                                                GAME OF THE WEEK
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: "flex", justifyContent: "space-between", px: 1.5, pt: 1.5 }}>
                                        <Typography variant="body2" fontWeight="bold">
                                            {`${dateObj.toLocaleDateString('en-US', { weekday: 'short' })}, ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 1.5 }}>
                                                            <Typography
                                                                variant="body2"
                                                                onClick={() => {
                                                                    setShowStevenInfo(true);
                                                                    setSelectedGameId(game["gameId"]);
                                                                    setSelectedGame({ home: home_team, away: away_team, homeSpread: home_spread, awaySpread: away_spread, over });
                                                                }}
                                                                sx={{ fontSize: "0.85rem", textDecoration: "underline", cursor: "pointer", color: "text.secondary" }}
                                                            >
                                                                Game Info
                                                            </Typography>
                                                        </Box>
                                    </Box>
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", width: "100%" }}>
                                        <div className={`team-container ${away_picked ? (isGotw ? "gotw-picked" : "picked") : ""}`} onClick={() =>
                                            updatePick(
                                                game["gameId"],
                                                home_team,
                                                away_team,
                                                isGotw ? "gotw" : (away_spread > 0 ? "dog" : "favorite"),
                                                away_spread > 0 ? underdog_spread : favorite_spread,
                                                away_spread > 0 ? underdog : favorite,
                                                commenceTime
                                            )
                                        }>
                                            <img src={away_logo} alt={away_team} className="logo" />
                                            <div className="team-record">{records[away_team] ?? ""}</div>
                                            <div><div className="team-name">{away_team}</div><b>{away_spread > 0 ? "+" + away_spread : away_spread}</b></div>
                                        </div>
                                        <div className={`team-container ${home_picked ? (isGotw ? "gotw-picked" : "picked") : ""}`} onClick={() =>
                                            updatePick(
                                                game["gameId"],
                                                home_team,
                                                away_team,
                                                isGotw ? "gotw" : (away_spread > 0 ? "favorite" : "dog"),
                                                away_spread > 0 ? favorite_spread : underdog_spread,
                                                away_spread > 0 ? favorite : underdog,
                                                commenceTime
                                            )
                                        }>
                                            <img src={home_logo} alt={home_team} className="logo" />
                                            <div className="team-record">{records[home_team] ?? ""}</div>
                                            <div><div className="team-name">{home_team}</div><b>{home_spread > 0 ? "+" + home_spread : home_spread}</b></div>
                                        </div>
                                        <div className="icon-text-container">
                                                {(isGotw ? tempPicks.find(obj => obj.type === "gotw" && obj.text.includes("Over")) : over_picked) ? (
                                                    <span className={isGotw ? "gotw-total-picked" : "total-picked"}>
                                                        <h2 className="bi bi-arrow-up-square-fill" onClick={() =>
                                                            updatePick(game["gameId"], home_team, away_team, isGotw ? "gotw" : "over", over, `${home_team} ${away_team} Over ${over}`, commenceTime)
                                                        }></h2>
                                                    </span>
                                                ) : (
                                                    <h2 className="total bi bi-arrow-up-square-fill" onClick={() =>
                                                        updatePick(game["gameId"], home_team, away_team, isGotw ? "gotw" : "over", over, `${home_team} ${away_team} Over ${over}`, commenceTime)
                                                    }></h2>
                                                )}
                                                <div className="over-text"><b>{over}</b></div>
                                                {(isGotw ? tempPicks.find(obj => obj.type === "gotw" && obj.text.includes("Under")) : under_picked) ? (
                                                    <span className={isGotw ? "gotw-total-picked" : "total-picked"}>
                                                        <h2 className="bi bi-arrow-down-square-fill" onClick={() =>
                                                            updatePick(game["gameId"], home_team, away_team, isGotw ? "gotw" : "under", under, `${home_team} ${away_team} Under ${under}`, commenceTime)
                                                        }></h2>
                                                    </span>
                                                ) : (
                                                    <h2 className="total bi bi-arrow-down-square-fill" onClick={() =>
                                                        updatePick(game["gameId"], home_team, away_team, isGotw ? "gotw" : "under", under, `${home_team} ${away_team} Under ${under}`, commenceTime)
                                                    }></h2>
                                                )}
                                            </div>
                                    </div>
                                </Paper>
                            );
                        })}
                <Box sx={{ pb: 10 }} />
                </Box>
                <Box sx={{
                    position: "fixed",
                    bottom: 20,
                    left: 0,
                    right: 0,
                    px: 2,
                    zIndex: 1000,
                }}>
                    <StevenButton
                        onClick={() => setShowConfirm(true)}
                    sx={{
                        width: "100%",
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: "bold",
                        borderRadius: "50px",
                        backgroundColor: "white",
                        color: "black",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        "&:hover": {
                            backgroundColor: "#f0f0f0",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        },
                        transition: "all 0.2s ease-in-out",
                    }}
                >
                    Submit Picks
                </StevenButton>
            </Box>
        </>
    );
};

export default StevenGameList;
