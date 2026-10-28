// Diff the user's locally staged picks (tempPicks) against what is saved on
// the server (selectedPicks). Picks are keyed by type — one per type per week.
export const getPickChanges = (selectedPicks = [], tempPicks = []) => {
    const additions = tempPicks.filter(tempPick => {
        const existing = selectedPicks.find(p => p.type === tempPick.type);
        if (!existing) return true;
        return existing.gameId !== tempPick.gameId || existing.text !== tempPick.text;
    });
    const removals = selectedPicks.filter(existing =>
        !tempPicks.find(p => p.type === existing.type)
    );
    return { additions, removals, count: additions.length + removals.length };
};

export const PICK_TYPES = ["favorite", "dog", "over", "under", "gotw"];
