import { createTheme } from '@mui/material';

// Shared color tokens. Use these (or the matching theme palette entries /
// CSS variables in index.css) instead of hardcoding hex values in components.
export const colors = {
  primary: '#90caf9',
  gold: '#D4AF37',
  goldBright: '#FFD700',
  donate: '#e91e63',
  donateHover: '#ad1457',
  rules: '#ef5350',
  rulesHover: '#c62828',
  lineMoved: '#ffb74d',
};

// Result colors for a pick: 1 = win, -1 = loss, 0 = push.
export const resultColors = {
  win: { bg: 'rgba(27,94,32,0.35)', text: '#a5d6a7' },
  loss: { bg: 'rgba(127,0,0,0.35)', text: '#ef9a9a' },
  push: { bg: 'rgba(74,56,0,0.35)', text: '#ffe082' },
};

export const getResultColor = (result) => {
  if (result === 1) return resultColors.win;
  if (result === -1) return resultColors.loss;
  if (result === 0) return resultColors.push;
  return null;
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: colors.primary },
    gold: { main: colors.gold, light: colors.goldBright, contrastText: '#3d2b00' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

export default theme;
