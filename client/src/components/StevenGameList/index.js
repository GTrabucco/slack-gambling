import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import StevenGameInfo from "../StevenGameInfo";
import StevenButton from "../Common/StevenButton";
import gameService from "../../services/gameService";
import pickService from "../../services/pickService";
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
    const [showStevenInfo, setShowStevenInfo] = useState(false)
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
            setError('Error submitting pick');
        }
    }
    const submitPicks = async (e) => {
        e.preventDefault();
        const additions = tempPicks.filter(tempPick => {
            const existing = selectedPicks.find(p => p.type === tempPick.type);
            if (!existing) return true;
            return existing.gameId !== tempPick.gameId || existing.text !== tempPick.text;
        });
        for (let pick of additions) {
            await submitPick(pick)
        }

        await fetchPicks();
        setMessage("Successfully Submitted Picks")
        window.scrollTo({ top: 0, behavior: "smooth" })
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
            if (gameStarted(existingPickCommenceTime)) {
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

        const oppositePick = tempPicks.find(pick => pick.type === isOpposite(type) && pick.gameId === gameId)
        if (oppositePick) {
            setTempPicks(prevState => {
                const oppositeIndex = prevState.findIndex(
                    pick => pick.type === isOpposite(type) && pick.gameId === gameId
                );

                if (oppositeIndex !== -1 && prevState[oppositeIndex].gameId === gameId) {
                    const newState = [...prevState];
                    newState.splice(oppositeIndex, 1);
                    return newState;
                }

                if (oppositeIndex !== -1) {
                    const newState = [...prevState];
                    newState[oppositeIndex] = { gameId, homeTeam, awayTeam, type, value, text };
                    return newState;
                }

                return [...prevState, { gameId, homeTeam, awayTeam, type, value, text }];
            });
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
        ? [...games].sort((a, b) => new Date(b["commence_time"]) - new Date(a["commence_time"]))[0]["_id"]
        : null;

    // Build the ordered list: GOTW game first (as gotw), then all games in chronological order (GOTW game included as regular)
    const sortedGames = [...games].sort((a, b) => new Date(a["commence_time"]) - new Date(b["commence_time"]));
    const gotwGame = games.find(g => g["_id"] === gotwGameId);
    const gameEntries = gotwGame
        ? [{ game: gotwGame, isGotw: true }, ...sortedGames.map(g => ({ game: g, isGotw: false }))]
        : sortedGames.map(g => ({ game: g, isGotw: false }));

    return (
        <>
            <StevenGameInfo
                showStevenInfo={showStevenInfo}
                selectedGameId={selectedGameId}
                setShowStevenInfo={setShowStevenInfo}
            />
            <Box component="form" id="game-picks-form" onSubmit={(e) => submitPicks(e)} sx={{ maxWidth: 600, mx: "auto" }}>
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

                            const away_picked = Array.isArray(tempPicks)
                                ? isGotw
                                    ? tempPicks.find(obj => obj.type === "gotw" && !obj.text.includes("Over") && !obj.text.includes("Under") && obj.text.includes(away_team_name))
                                    : tempPicks.find(obj => obj.type === "dog" && obj.text.includes(away_team_name)) ||
                                      tempPicks.find(obj => obj.type === "favorite" && obj.text.includes(away_team_name))
                                : null;
                            const home_picked = Array.isArray(tempPicks)
                                ? isGotw
                                    ? tempPicks.find(obj => obj.type === "gotw" && !obj.text.includes("Over") && !obj.text.includes("Under") && obj.text.includes(home_team_name))
                                    : tempPicks.find(obj => obj.type === "dog" && obj.text.includes(home_team_name)) ||
                                      tempPicks.find(obj => obj.type === "favorite" && obj.text.includes(home_team_name))
                                : null;
                            const over_picked = Array.isArray(tempPicks)
                                ? tempPicks.find(obj => obj.type === "over" && obj.gameId === game["_id"])
                                : null;
                            const under_picked = Array.isArray(tempPicks)
                                ? tempPicks.find(obj => obj.type === "under" && obj.gameId === game["_id"])
                                : null;

                            const dateObj = new Date(commenceTime);
                            return (
                                <Paper
                                    key={isGotw ? `gotw-${game["_id"]}` : game["_id"]}
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
                                        <Typography
                                            variant="body2"
                                            onClick={() => {
                                                setShowStevenInfo(true);
                                                setSelectedGameId(game["gameId"]);
                                            }}
                                            sx={{ fontSize: "0.85rem", textDecoration: "underline", cursor: "pointer", color: "text.secondary" }}
                                        >
                                            Weather Info
                                        </Typography>
                                    </Box>
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", width: "100%" }}>
                                        <div className={`team-container ${away_picked ? (isGotw ? "gotw-picked" : "picked") : ""}`} onClick={() =>
                                            updatePick(
                                                game["_id"],
                                                home_team,
                                                away_team,
                                                isGotw ? "gotw" : (away_spread > 0 ? "dog" : "favorite"),
                                                away_spread > 0 ? underdog_spread : favorite_spread,
                                                away_spread > 0 ? underdog : favorite,
                                                commenceTime
                                            )
                                        }>
                                            <img src={away_logo} alt={away_team} className="logo" />
                                            <div><div className="team-name">{away_team}</div><b>{away_spread > 0 ? "+" + away_spread : away_spread}</b></div>
                                        </div>
                                        <div className={`team-container ${home_picked ? (isGotw ? "gotw-picked" : "picked") : ""}`} onClick={() =>
                                            updatePick(
                                                game["_id"],
                                                home_team,
                                                away_team,
                                                isGotw ? "gotw" : (away_spread > 0 ? "favorite" : "dog"),
                                                away_spread > 0 ? favorite_spread : underdog_spread,
                                                away_spread > 0 ? favorite : underdog,
                                                commenceTime
                                            )
                                        }>
                                            <img src={home_logo} alt={home_team} className="logo" />
                                            <div><div className="team-name">{home_team}</div><b>{home_spread > 0 ? "+" + home_spread : home_spread}</b></div>
                                        </div>
                                        <div className="icon-text-container">
                                                {(isGotw ? tempPicks.find(obj => obj.type === "gotw" && obj.text.includes("Over")) : over_picked) ? (
                                                    <span className={isGotw ? "gotw-total-picked" : "total-picked"}>
                                                        <h2 className="bi bi-arrow-up-square-fill" onClick={() =>
                                                            updatePick(game["_id"], home_team, away_team, isGotw ? "gotw" : "over", over, `${home_team} ${away_team} Over ${over}`, commenceTime)
                                                        }></h2>
                                                    </span>
                                                ) : (
                                                    <h2 className="total bi bi-arrow-up-square-fill" onClick={() =>
                                                        updatePick(game["_id"], home_team, away_team, isGotw ? "gotw" : "over", over, `${home_team} ${away_team} Over ${over}`, commenceTime)
                                                    }></h2>
                                                )}
                                                <div className="over-text"><b>{over}</b></div>
                                                {(isGotw ? tempPicks.find(obj => obj.type === "gotw" && obj.text.includes("Under")) : under_picked) ? (
                                                    <span className={isGotw ? "gotw-total-picked" : "total-picked"}>
                                                        <h2 className="bi bi-arrow-down-square-fill" onClick={() =>
                                                            updatePick(game["_id"], home_team, away_team, isGotw ? "gotw" : "under", under, `${home_team} ${away_team} Under ${under}`, commenceTime)
                                                        }></h2>
                                                    </span>
                                                ) : (
                                                    <h2 className="total bi bi-arrow-down-square-fill" onClick={() =>
                                                        updatePick(game["_id"], home_team, away_team, isGotw ? "gotw" : "under", under, `${home_team} ${away_team} Under ${under}`, commenceTime)
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
                    type="submit"
                    form="game-picks-form"
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
