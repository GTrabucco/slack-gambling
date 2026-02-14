import Button from '@mui/material/Button';
import './style.css';

const StevenButton = ({ children, variant = "contained", ...props }) => {
  return (
    <Button variant={variant} {...props} >
      {children}
    </Button>
  );
};

export default StevenButton;
