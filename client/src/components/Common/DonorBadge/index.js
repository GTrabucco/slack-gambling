import { useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import donorTierService from "../../../services/donorTierService";
import { DonorIcon } from "./icons";

// Badge shown next to a user's name wherever they appear (standings,
// leaderboard, GOTW reveal) to recognize fundraiser donors. Tiers (icon,
// color, label, and dollar threshold) are fully admin-configurable via the
// Manage Donor Perks screen — this component just picks the highest tier
// the given `amount` qualifies for.
const DonorBadge = ({ amount, sx }) => {
    const [tiers, setTiers] = useState([]);

    useEffect(() => {
        donorTierService.getTiers().then(setTiers).catch(() => {});
    }, []);

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0 || tiers.length === 0) return null;

    const tier = tiers
        .filter((t) => numAmount >= Number(t.minAmount))
        .sort((a, b) => Number(b.minAmount) - Number(a.minAmount))[0];
    if (!tier) return null;

    return (
        <Tooltip title={tier.label}>
            <span style={{ display: "inline-flex", alignItems: "center", ...sx }}>
                <DonorIcon iconKey={tier.icon} color={tier.color} style={{ fontSize: 12 }} aria-label={tier.label} />
            </span>
        </Tooltip>
    );
};

export default DonorBadge;
