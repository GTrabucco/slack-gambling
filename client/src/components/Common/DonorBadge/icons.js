import {
    FaGem,
    FaStar,
    FaCrown,
    FaTrophy,
    FaMedal,
    FaFire,
    FaBolt,
    FaHeart,
    FaGift,
    FaDollarSign,
    FaShieldAlt,
    FaRocket,
    FaMoon,
    FaSun,
    FaLeaf,
    FaAnchor,
    FaFeatherAlt,
    FaPaw,
    FaSkullCrossbones,
    FaMagic,
    FaDragon,
    FaDice,
} from "react-icons/fa";

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
    shield: { type: "component", Component: FaShieldAlt },
    rocket: { type: "component", Component: FaRocket },
    moon: { type: "component", Component: FaMoon },
    sun: { type: "component", Component: FaSun },
    leaf: { type: "component", Component: FaLeaf },
    anchor: { type: "component", Component: FaAnchor },
    feather: { type: "component", Component: FaFeatherAlt },
    paw: { type: "component", Component: FaPaw },
    skull: { type: "component", Component: FaSkullCrossbones },
    magic: { type: "component", Component: FaMagic },
    dragon: { type: "component", Component: FaDragon },
    dice: { type: "component", Component: FaDice },
    // The image icon is rendered as two stacked masks: a colored "fill"
    // layer (the full smiley silhouette, from the original PNG's alpha
    // channel) tinted per-tier, plus a black "outline" layer on top (just
    // the stroke lines, derived separately since the source PNG's face
    // fill is opaque white too). This tints the face per-tier and keeps
    // the outline black.
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
                <span style={{ ...maskStyle(entry.fillSrc), backgroundColor: color || "#D4AF37" }} />
                <span style={{ ...maskStyle(entry.outlineSrc), backgroundColor: "#000" }} />
            </span>
        );
    }
    const Icon = entry.Component;
    return <Icon style={{ color: color || "#D4AF37", ...style }} {...props} />;
};
