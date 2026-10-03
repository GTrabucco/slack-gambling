import { FaGem, FaStar, FaCrown, FaTrophy, FaMedal, FaFire, FaBolt, FaHeart, FaGift, FaDollarSign } from "react-icons/fa";

// Shared icon registry used both by the DonorBadge (to render a tier's icon)
// and the Manage Donor Perks admin screen (to let an admin pick an icon for
// a tier). Keyed by a stable string so it can be stored in Mongo and survive
// renames/reordering of the underlying react-icons imports.
//
// Two icon shapes are supported:
//  - { type: "component", Component } — a react-icons font icon, tinted via
//    the normal CSS `color` property.
//  - { type: "image", src } — a static image (e.g. the site logo) placed
//    manually in client/public. It's recolored per-tier with a CSS mask
//    (the image's alpha channel becomes the shape; `background-color`
//    supplies the tier's color), so one image file works for every color.
export const DONOR_ICONS = {
    gem: { type: "component", Component: FaGem },
    star: { type: "component", Component: FaStar },
    crown: { type: "component", Component: FaCrown },
    trophy: { type: "component", Component: FaTrophy },
    medal: { type: "component", Component: FaMedal },
    fire: { type: "component", Component: FaFire },
    bolt: { type: "component", Component: FaBolt },
    heart: { type: "component", Component: FaHeart },
    gift: { type: "component", Component: FaGift },
    dollar: { type: "component", Component: FaDollarSign },
    // The image icon is rendered as two stacked masks: a white "fill" layer
    // (the full smiley silhouette, from the original PNG's alpha channel)
    // plus a colored "outline" layer on top (just the stroke lines, derived
    // separately since the source PNG's face fill is opaque white too).
    // This keeps the face white and only tints the outline per-tier.
    stevenlogo: { type: "image", fillSrc: "/stevenlogo.png", outlineSrc: "/stevenlogo-outline.png" },
};

export const DONOR_ICON_OPTIONS = Object.keys(DONOR_ICONS).map((key) => ({
    value: key,
    label: key === "stevenlogo" ? "Steven Logo" : key.charAt(0).toUpperCase() + key.slice(1),
}));

const maskStyle = (src) => ({
    position: "absolute",
    inset: 0,
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
});

// Renders a registry entry (component or image) tinted to `color`.
export const DonorIcon = ({ iconKey, color, style, ...props }) => {
    const entry = DONOR_ICONS[iconKey] || DONOR_ICONS.gem;
    if (entry.type === "image") {
        const size = (style && style.fontSize) || 14;
        return (
            <span
                {...props}
                style={{ position: "relative", display: "inline-block", width: size, height: size, ...style, fontSize: undefined }}
            >
                <span style={{ ...maskStyle(entry.fillSrc), backgroundColor: "#fff" }} />
                <span style={{ ...maskStyle(entry.outlineSrc), backgroundColor: color || "#D4AF37" }} />
            </span>
        );
    }
    const Icon = entry.Component;
    return <Icon style={{ color: color || "#D4AF37", ...style }} {...props} />;
};
