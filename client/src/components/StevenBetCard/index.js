import { FaTrash } from 'react-icons/fa';
import { BsArrowCounterclockwise } from 'react-icons/bs';
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import pickService from "../../services/pickService";
import ResultIcon from "../Common/ResultIcon";
import { colors, getResultColor } from "../../theme";
import { getPickChanges, PICK_TYPES } from "../../utils/pickChanges";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../Common/StevenTable";

const iconButtonStyle = {
    cursor: 'pointer',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
};

const StevenBetCard = ({ selectedPicks, tempPicks, setMessage, setError, getCommenceTimeByGameId, user, gameStarted, setSelectedPicks, setTempPicks }) => {
    const removePick = async (pickIdentifier, text) => {
        const existingPickGameId = pickIdentifier.split('-')[0];
        const commenceTime = getCommenceTimeByGameId(existingPickGameId)
        if (gameStarted(commenceTime)) {
            setError("Can't Remove. Game Already Started")
            return;
        }

        try {
            const gameId = pickIdentifier.split('-')[0]
            const pickType = pickIdentifier.split('-')[1]
            const username = user.name;
            const data = { username, gameId, pickType, text }
            await pickService.removePick(data);
            const removedPick = selectedPicks.find(pick => pick.gameId === gameId && pick.type === pickType);
            if (removedPick) {
                setMessage(`Removed ${removedPick.text}`);
                setSelectedPicks(prev => prev.filter(pick => !(pick.gameId === gameId && pick.type === pickType)));
                setTempPicks(prev => prev.filter(pick => !(pick.gameId === gameId && pick.type === pickType)));
            } else {
                setMessage("Nothing to remove");
            }
        } catch (error) {
            setError('Error submitting pick');
        }
    }

    // Discard an unsubmitted change for this pick type, restoring the saved pick (if any).
    const undoChange = (type) => {
        const saved = selectedPicks.find(p => p.type === type);
        setTempPicks(prev => {
            const without = prev.filter(p => p.type !== type);
            return saved ? [...without, saved] : without;
        });
    };

    const safeSelected = Array.isArray(selectedPicks) ? selectedPicks : [];
    const safeTemp = Array.isArray(tempPicks) ? tempPicks : [];
    const { count: pendingCount } = getPickChanges(safeSelected, safeTemp);

    const renderAction = (label, icon, onActivate, color) => (
        <span
            onClick={onActivate}
            style={{ ...iconButtonStyle, color }}
            aria-label={label}
            title={label}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onActivate();
                }
            }}
        >
            {icon}
        </span>
    );

    return (
        <Box sx={{ maxWidth: 600, mx: "auto", my: 2 }}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "text.disabled" }}>
                        My Picks
                    </Typography>
                    {pendingCount > 0 && (
                        <Typography sx={{ fontSize: 11, color: colors.lineMoved, fontWeight: 600 }}>
                            {pendingCount} unsubmitted {pendingCount === 1 ? "change" : "changes"}
                        </Typography>
                    )}
                </Box>
                <StevenTableContainer sx={{ overflowX: "visible" }}>
                    <StevenTable sx={{ minWidth: 0, tableLayout: "fixed", width: "100%" }}>
                        <StevenTableBody sx={{ "& .MuiTableRow-root:nth-of-type(odd)": { backgroundColor: "transparent" } }}>
                        {PICK_TYPES.map((type) => {
                            const saved = safeSelected.find(obj => obj.type === type);
                            const staged = safeTemp.find(obj => obj.type === type);
                            const isPending = !!staged && (!saved || saved.gameId !== staged.gameId || saved.text !== staged.text);
                            const isRemoving = !staged && !!saved;
                            const pick = isRemoving ? saved : staged;
                            const value = pick ? pick.text : "-";

                            const result = !isPending && !isRemoving ? saved?.result : undefined;
                            const rowColor = getResultColor(result)
                                ?? (type === 'gotw'
                                    ? { bg: "transparent", text: colors.gold }
                                    : { bg: "transparent", text: "inherit" });

                            return (
                                <StevenTableRow key={type} sx={{
                                    "&.MuiTableRow-root": { backgroundColor: `${rowColor.bg} !important` },
                                    "& td": { color: rowColor.text, fontWeight: pick ? "bold" : "normal" },
                                    ...(isPending || isRemoving ? { boxShadow: `inset 3px 0 0 ${colors.lineMoved}` } : {}),
                                }}>
                                    <StevenTableCell sx={{ whiteSpace: "normal", wordBreak: "break-word", width: "30%" }}>
                                        <b>{type === 'gotw' ? 'Game of the Week' : type.charAt(0).toUpperCase() + type.slice(1)}</b>
                                    </StevenTableCell>
                                    <StevenTableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                                            <ResultIcon result={result} color={rowColor.text} />
                                            <span style={isRemoving ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
                                                {value}
                                            </span>
                                            {(isPending || isRemoving) && (
                                                <Chip
                                                    label={isRemoving ? "Will be removed" : "Not submitted"}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ height: 20, fontSize: 10, fontWeight: 600, color: colors.lineMoved, borderColor: colors.lineMoved }}
                                                />
                                            )}
                                        </Box>
                                    </StevenTableCell>
                                    <StevenTableCell sx={{ whiteSpace: "nowrap", width: 40, textAlign: "center" }}>
                                        {(isPending || isRemoving)
                                            ? renderAction(`Undo ${type} change`, <BsArrowCounterclockwise />, () => undoChange(type), colors.lineMoved)
                                            : saved && renderAction(`Remove ${type} pick`, <FaTrash />, () => removePick(saved.gameId + "-" + type, saved.text), rowColor.text)}
                                    </StevenTableCell>
                                </StevenTableRow>
                            );
                        })}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
            </Paper>
        </Box>
    );
};

export default StevenBetCard;
