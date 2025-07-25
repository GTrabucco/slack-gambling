import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import './style.css';

const StevenButton = ({ children, ...props }) => {
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    if (isClicked) {
      const timeout = setTimeout(() => setIsClicked(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isClicked]);

  return (
    <Button variant="contained" {...props} >
        {children}
    </Button>
  );
};

export default StevenButton;
