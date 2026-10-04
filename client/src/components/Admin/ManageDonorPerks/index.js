import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import { BsPencil, BsTrash, BsCheck, BsX } from "react-icons/bs";
import StevenButton from "../../Common/StevenButton";
import StevenSelect from "../../Common/StevenSelect";
import { DONOR_ICON_OPTIONS, DonorIcon } from "../../Common/DonorBadge/icons";
import donorTierService from "../../../services/donorTierService";
import featureAccessService from "../../../services/featureAccessService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../../Common/StevenTable";

// Distinct default colors so each new tier stands out instead of all
// defaulting to the same gold — admins can still override via the color
// picker.
const DEFAULT_COLOR_PALETTE = [
    "#D4AF37", "#4A90D9", "#50C878", "#C0392B", "#9B59B6",
    "#1ABC9C", "#E67E22", "#2C3E50", "#CD7F32", "#E91E8C",
];
const getDefaultColor = (index) => DEFAULT_COLOR_PALETTE[index % DEFAULT_COLOR_PALETTE.length];

const makeEmptyForm = (index = 0) => ({ minAmount: "", label: "", icon: DONOR_ICON_OPTIONS[0].value, color: getDefaultColor(index) });
const EMPTY_FORM = makeEmptyForm(0);

const IconPreview = ({ iconKey, color }) => (
    <DonorIcon iconKey={iconKey} color={color} style={{ fontSize: 18 }} />
);

// Shows the icon next to its name in a DONOR_ICON_OPTIONS dropdown, tinted
// with whatever color is currently selected for that tier/form.
const renderIconOption = (color) => (option) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <DonorIcon iconKey={option.value} color={color} style={{ fontSize: 16 }} />
        {option.label}
    </Box>
);

const ADMIN_ONLY_VALUE = "__admin_only__";

const ManageDonorPerks = () => {
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newForm, setNewForm] = useState(EMPTY_FORM);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [accessForm, setAccessForm] = useState({ oddsAlertThreshold: "", publicBettingThreshold: "" });
    const [accessLoading, setAccessLoading] = useState(true);
    const [accessSaving, setAccessSaving] = useState(false);

    const fetchTiers = async () => {
        try {
            donorTierService.invalidateCache();
            const fetched = await donorTierService.getTiers();
            setTiers(fetched.slice().sort((a, b) => Number(b.minAmount) - Number(a.minAmount)));
            // Give the next untouched "Add Tier" form a fresh default color.
            setNewForm(p => (p.minAmount === "" && p.label === "" ? makeEmptyForm(fetched.length) : p));
        } catch (e) {
            setError("Error fetching donor badge tiers");
        } finally {
            setLoading(false);
        }
    };

    const fetchAccessSettings = async () => {
        try {
            featureAccessService.invalidateCache();
            const settings = await featureAccessService.getSettings();
            setAccessForm({
                oddsAlertThreshold: settings.oddsAlertThreshold != null ? String(settings.oddsAlertThreshold) : ADMIN_ONLY_VALUE,
                publicBettingThreshold: settings.publicBettingThreshold != null ? String(settings.publicBettingThreshold) : ADMIN_ONLY_VALUE,
            });
        } catch (e) {
            setError("Error fetching feature access settings");
        } finally {
            setAccessLoading(false);
        }
    };

    const handleSaveAccessSettings = async () => {
        setAccessSaving(true);
        try {
            await featureAccessService.updateSettings({
                oddsAlertThreshold: accessForm.oddsAlertThreshold === ADMIN_ONLY_VALUE ? null : Number(accessForm.oddsAlertThreshold),
                publicBettingThreshold: accessForm.publicBettingThreshold === ADMIN_ONLY_VALUE ? null : Number(accessForm.publicBettingThreshold),
            });
            featureAccessService.invalidateCache();
            setSuccess("Feature access thresholds updated.");
        } catch (e) {
            setError("Error saving feature access thresholds");
        } finally {
            setAccessSaving(false);
        }
    };

    // Dropdown options derived from configured donor badge tiers (lowest
    // minAmount first, so picking one reads naturally as a rising bar), plus
    // an explicit "Admin Only" option that clears the threshold.
    const tierAccessOptions = [
        { value: ADMIN_ONLY_VALUE, label: "Admin Only" },
        ...tiers.slice().sort((a, b) => Number(a.minAmount) - Number(b.minAmount)).map(tier => ({
            value: String(tier.minAmount),
            label: `${tier.label} ($${tier.minAmount}+)`,
        })),
    ];

    // If a previously saved threshold doesn't match any current tier's
    // minAmount (e.g. the tier was since deleted or renamed), surface it as
    // a "Custom" option so the dropdown still shows a valid selection
    // instead of silently reverting.
    const withCustomFallback = (options, currentValue) => {
        if (currentValue === ADMIN_ONLY_VALUE || options.some(o => o.value === currentValue)) return options;
        return [...options, { value: currentValue, label: `Custom ($${currentValue}+)` }];
    };
    const oddsAlertOptions = withCustomFallback(tierAccessOptions, accessForm.oddsAlertThreshold);
    const publicBettingOptions = withCustomFallback(tierAccessOptions, accessForm.publicBettingThreshold);

    useEffect(() => { fetchTiers(); fetchAccessSettings(); }, []);

    const handleEdit = (tier) => {
        setEditingId(tier._id);
        setEditForm({
            minAmount: String(tier.minAmount),
            label: tier.label,
            icon: tier.icon,
            color: tier.color || "#D4AF37",
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = async () => {
        if (!editForm.minAmount || !editForm.label) { setError("Amount and label are required."); return; }
        try {
            await donorTierService.updateTier(editingId, {
                minAmount: Number(editForm.minAmount),
                label: editForm.label,
                icon: editForm.icon,
                color: editForm.color,
            });
            setSuccess(`${editForm.label} updated.`);
            setEditingId(null);
            setEditForm({});
            fetchTiers();
        } catch (e) {
            setError("Error saving donor badge tier");
        }
    };

    const handleDelete = async (tier) => {
        if (!window.confirm(`Delete the "${tier.label}" tier? This cannot be undone.`)) return;
        try {
            await donorTierService.deleteTier(tier._id);
            setSuccess(`${tier.label} deleted.`);
            fetchTiers();
        } catch (e) {
            setError("Error deleting donor badge tier");
        }
    };

    const handleCreate = async () => {
        if (!newForm.minAmount || !newForm.label) { setError("Amount and label are required."); return; }
        try {
            await donorTierService.createTier({
                minAmount: Number(newForm.minAmount),
                label: newForm.label,
                icon: newForm.icon,
                color: newForm.color,
            });
            setSuccess(`"${newForm.label}" tier created.`);
            setNewForm(EMPTY_FORM);
            setError("");
            fetchTiers();
        } catch (e) {
            setError("Error creating donor badge tier");
        }
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>Manage Donor Perks</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Define badge tiers by donation amount, and configure which donation-based perks (like early access
                to beta features) donors unlock. A user's badge (shown next to their name in standings, the
                leaderboard, and the GOTW reveal) is the highest tier their donation amount meets or exceeds. Set a
                user's donation amount in Manage Accounts.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

            {/* Feature Access Thresholds */}
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 3, mb: 3, bgcolor: "background.paper" }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Beta Feature Access</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    These admin-only features also unlock for any donor whose donation amount meets or exceeds the
                    selected badge tier. Choose "Admin Only" to keep a feature restricted to admins.
                </Typography>
                {accessLoading ? <CircularProgress size={24} /> : (
                    <>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Odds Alert Access</Typography>
                                <StevenSelect
                                    value={accessForm.oddsAlertThreshold}
                                    onChange={e => setAccessForm(p => ({ ...p, oddsAlertThreshold: e.target.value }))}
                                    options={oddsAlertOptions}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Public Betting Info Access</Typography>
                                <StevenSelect
                                    value={accessForm.publicBettingThreshold}
                                    onChange={e => setAccessForm(p => ({ ...p, publicBettingThreshold: e.target.value }))}
                                    options={publicBettingOptions}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 2 }}>
                            <StevenButton onClick={handleSaveAccessSettings} disabled={accessSaving}>
                                {accessSaving ? "Saving..." : "Save Thresholds"}
                            </StevenButton>
                        </Box>
                    </>
                )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Create Tier Form */}
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 3, mb: 3, bgcolor: "background.paper" }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Add Tier</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6} md={2}>
                        <TextField
                            label="Min Amount ($)"
                            type="number"
                            value={newForm.minAmount}
                            onChange={e => setNewForm(p => ({ ...p, minAmount: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Label"
                            placeholder="e.g. Gold Donor"
                            value={newForm.label}
                            onChange={e => setNewForm(p => ({ ...p, label: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <StevenSelect
                            value={newForm.icon}
                            onChange={e => setNewForm(p => ({ ...p, icon: e.target.value }))}
                            options={DONOR_ICON_OPTIONS}
                            renderOption={renderIconOption(newForm.color)}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <TextField
                            label="Color"
                            type="color"
                            value={newForm.color}
                            onChange={e => setNewForm(p => ({ ...p, color: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={6} md={1}>
                        <IconPreview iconKey={newForm.icon} color={newForm.color} />
                    </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                    <StevenButton onClick={handleCreate}>Add Tier</StevenButton>
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {loading ? (
                <CircularProgress />
            ) : (
                <StevenTableContainer>
                    <StevenTable>
                        <StevenTableHead>
                            <StevenTableRow>
                                <StevenTableCell>Badge</StevenTableCell>
                                <StevenTableCell>Label</StevenTableCell>
                                <StevenTableCell>Min Amount</StevenTableCell>
                                <StevenTableCell>Icon</StevenTableCell>
                                <StevenTableCell>Color</StevenTableCell>
                                <StevenTableCell>Actions</StevenTableCell>
                            </StevenTableRow>
                        </StevenTableHead>
                        <StevenTableBody>
                            {tiers.length > 0 ? tiers.map(tier => (
                                <StevenTableRow key={tier._id}>
                                    {editingId === tier._id ? (
                                        <>
                                            <StevenTableCell>
                                                <IconPreview iconKey={editForm.icon} color={editForm.color} />
                                            </StevenTableCell>
                                            <StevenTableCell>
                                                <TextField value={editForm.label} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} size="small" sx={{ width: 140 }} />
                                            </StevenTableCell>
                                            <StevenTableCell>
                                                <TextField type="number" value={editForm.minAmount} onChange={e => setEditForm(p => ({ ...p, minAmount: e.target.value }))} size="small" sx={{ width: 90 }} />
                                            </StevenTableCell>
                                            <StevenTableCell>
                                                <StevenSelect
                                                    value={editForm.icon}
                                                    onChange={e => setEditForm(p => ({ ...p, icon: e.target.value }))}
                                                    options={DONOR_ICON_OPTIONS}
                                                    renderOption={renderIconOption(editForm.color)}
                                                    size="small"
                                                    sx={{ minWidth: 110 }}
                                                />
                                            </StevenTableCell>
                                            <StevenTableCell>
                                                <TextField type="color" value={editForm.color} onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))} size="small" sx={{ width: 70 }} />
                                            </StevenTableCell>
                                            <StevenTableCell>
                                                <Tooltip title="Save">
                                                    <IconButton size="small" onClick={handleSaveEdit}><BsCheck /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="Cancel">
                                                    <IconButton size="small" onClick={handleCancelEdit}><BsX /></IconButton>
                                                </Tooltip>
                                            </StevenTableCell>
                                        </>
                                    ) : (
                                        <>
                                            <StevenTableCell><IconPreview iconKey={tier.icon} color={tier.color} /></StevenTableCell>
                                            <StevenTableCell>{tier.label}</StevenTableCell>
                                            <StevenTableCell>${tier.minAmount}+</StevenTableCell>
                                            <StevenTableCell>{tier.icon}</StevenTableCell>
                                            <StevenTableCell>{tier.color}</StevenTableCell>
                                            <StevenTableCell>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => handleEdit(tier)}><BsPencil /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={() => handleDelete(tier)}><BsTrash /></IconButton>
                                                </Tooltip>
                                            </StevenTableCell>
                                        </>
                                    )}
                                </StevenTableRow>
                            )) : (
                                <StevenTableRow>
                                    <StevenTableCell colSpan={6}>No donor badge tiers configured yet.</StevenTableCell>
                                </StevenTableRow>
                            )}
                        </StevenTableBody>
                    </StevenTable>
                </StevenTableContainer>
            )}
        </Box>
    );
};

export default ManageDonorPerks;
