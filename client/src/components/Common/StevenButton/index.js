import Button from '@mui/material/Button';
import './style.css';

// The white "Steven" style only applies to the default filled button —
// outlined/text variants keep their own transparent background so callers
// can color them via sx without fighting a forced white fill.
const containedSx = {
  backgroundColor: "white",
  color: "black",
  "&:hover": { backgroundColor: "#f0f0f0" },
};

const StevenButton = ({ children, variant = "contained", sx, ...props }) => {
  return (
    <Button
      variant={variant}
      {...props}
      sx={{
        ...(variant === "contained" ? containedSx : {}),
        ...sx
      }}
    >
      {children}
    </Button>
  );
};

export default StevenButton;
