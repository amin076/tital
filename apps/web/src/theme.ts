import { createTheme } from '@mui/material/styles';

export const titalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#173B57',
    },
    secondary: {
      main: '#2E6F6A',
    },
    background: {
      default: '#F4F7F9',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});
