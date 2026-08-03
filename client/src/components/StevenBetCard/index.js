import { FaTrash } from 'react-icons/fa';
import pickService from "../../services/pickService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../Common/StevenTable";

const StevenBetCard = ({ selectedPicks, setMessage, setError, getCommenceTimeByGameId, user, gameStarted, setSelectedPicks, setTempPicks }) => {
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

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <StevenTableContainer>
                <StevenTable>
                    <StevenTableBody>
                        {['favorite', 'dog', 'over', 'under', 'gotw'].map((type) => {
                            const pick = Array.isArray(selectedPicks)
                                ? selectedPicks.find(obj => obj.type === type)
                                : null;
                            var key = null;
                            var value = "-";
                            if (pick) {
                                value = pick.text;
                                key = pick.gameId + "-" + type
                            }
                            return (
                                <StevenTableRow key={type} sx={type === 'gotw' ? { "& td": { color: "#D4AF37", fontWeight: "bold" } } : {}}>
                                    <StevenTableCell>
                                        <b>{type === 'gotw' ? 'Game of the Week' : type.charAt(0).toUpperCase() + type.slice(1)}</b>
                                    </StevenTableCell>
                                    <StevenTableCell>
                                        {value}
                                    </StevenTableCell>
                                    <StevenTableCell style={{ textAlign: 'center' }}>
                                        {key && (
                                            <span
                                                onClick={() => removePick(key, value)}
                                                style={{
                                                    cursor: 'pointer',
                                                    color: type === 'gotw' ? '#D4AF37' : 'grey',
                                                    display: 'inline-flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                }}
                                                aria-label={`Remove ${type} pick`}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') removePick(key, value);
                                                }}
                                            >
                                                <FaTrash />
                                            </span>
                                        )}
                                    </StevenTableCell>
                                </StevenTableRow>
                            );
                        })}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
        </div>
    );
};

export default StevenBetCard;
