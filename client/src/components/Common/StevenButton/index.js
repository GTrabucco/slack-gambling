import Button from '@mui/material/Button';
import './style.css';

const StevenButton = ({ children, variant = "contained", ...props }) => {
  return (
    <Button
      variant={variant}
      {...props}
      sx={{
        backgroundColor: "white",
        color: "black",
        "&:hover": { backgroundColor: "#f0f0f0" },
        ...props.sx
      }}
    >
      {children}
    </Button>
  );
};

export default StevenButton;
