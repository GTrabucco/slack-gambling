import { BsCheckCircleFill, BsXCircleFill, BsDashCircleFill } from "react-icons/bs";
import { resultColors } from "../../../theme";

// Icon for a graded pick (1 = win, -1 = loss, 0 = push) so results aren't
// conveyed by color alone. Renders nothing for ungraded picks.
const RESULTS = {
    1: { Icon: BsCheckCircleFill, label: "Win", color: resultColors.win.text },
    [-1]: { Icon: BsXCircleFill, label: "Loss", color: resultColors.loss.text },
    0: { Icon: BsDashCircleFill, label: "Push", color: resultColors.push.text },
};

const ResultIcon = ({ result, size = 14, color, style }) => {
    const entry = RESULTS[result];
    if (!entry) return null;
    const { Icon, label } = entry;
    return (
        <Icon
            role="img"
            aria-label={label}
            title={label}
            size={size}
            style={{ color: color ?? entry.color, flexShrink: 0, verticalAlign: "middle", ...style }}
        />
    );
};

export default ResultIcon;
