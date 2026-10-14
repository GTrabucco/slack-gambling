import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import featureAccessService from "../../services/featureAccessService";
import userService from "../../services/userService";

// Injury score is available to admins and to donors at or above the configured
// threshold (Manage Donor Perks). `loading` is true until access is resolved.
const useInjuryScoreAccess = () => {
    const { user } = useAuth0();
    const isAdmin = user?.email?.toLowerCase() === "giulian.trabucco@gmail.com";
    const [state, setState] = useState({ loading: !isAdmin, canUse: isAdmin });

    useEffect(() => {
        if (isAdmin) {
            setState({ loading: false, canUse: true });
            return;
        }
        let cancelled = false;
        Promise.all([
            featureAccessService.getSettings(),
            userService.getByUsername(user.name),
        ]).then(([settings, res]) => {
            if (cancelled) return;
            const donation = Number(res.data?.[0]?.donationAmount) || 0;
            const threshold = settings.injuryScoreThreshold;
            setState({ loading: false, canUse: threshold != null && donation >= threshold });
        }).catch(() => {
            if (!cancelled) setState({ loading: false, canUse: false });
        });
        return () => { cancelled = true; };
    }, [isAdmin, user?.name]);

    return state;
};

export default useInjuryScoreAccess;
