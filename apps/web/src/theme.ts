import { alpha, createTheme } from '@mui/material/styles';

const navy = '#153A52';
const ink = '#14212B';
const teal = '#23766F';
const gold = '#B97824';

export const titalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: navy,
      dark: '#0C2B40',
      light: '#E8F0F5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: teal,
      dark: '#165B56',
      light: '#E8F4F1',
    },
    success: {
      main: '#2F7D4A',
      light: '#EAF5EE',
    },
    warning: {
      main: gold,
      light: '#FFF4E4',
    },
    error: {
      main: '#B64E4A',
      light: '#FCEDEC',
    },
    info: {
      main: '#2C6D98',
      light: '#EAF3F9',
    },
    background: {
      default: '#F4F7F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: ink,
      secondary: '#60717E',
    },
    divider: '#DCE4E9',
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: 'clamp(2.6rem, 6vw, 5.4rem)',
      lineHeight: 0.98,
      fontWeight: 800,
      letterSpacing: '-0.055em',
    },
    h2: {
      fontSize: 'clamp(2.2rem, 4vw, 4rem)',
      lineHeight: 1.03,
      fontWeight: 800,
      letterSpacing: '-0.045em',
    },
    h3: {
      fontSize: 'clamp(1.7rem, 2.6vw, 2.7rem)',
      lineHeight: 1.08,
      fontWeight: 760,
      letterSpacing: '-0.035em',
    },
    h4: {
      fontWeight: 760,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 740,
      letterSpacing: '-0.018em',
    },
    h6: {
      fontWeight: 720,
      letterSpacing: '-0.012em',
    },
    body1: {
      lineHeight: 1.65,
    },
    body2: {
      lineHeight: 1.55,
    },
    overline: {
      fontWeight: 800,
      letterSpacing: '0.08em',
      fontSize: '0.72rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 760,
      letterSpacing: '-0.01em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          color: ink,
        },
        '::selection': {
          backgroundColor: alpha(teal, 0.18),
        },
        '*:focus-visible': {
          outline: `3px solid ${alpha('#2C8FA3', 0.78)}`,
          outlineOffset: 2,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#10344D',
          borderBottom: `1px solid ${alpha('#FFFFFF', 0.08)}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 72,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: '#DCE4E9',
        },
        rounded: {
          borderRadius: 18,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderColor: '#DCE4E9',
          boxShadow: '0 1px 2px rgba(15, 42, 60, 0.025)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 12,
          paddingInline: 18,
          '&.MuiButton-containedPrimary': {
            boxShadow: '0 8px 22px rgba(21, 58, 82, 0.16)',
          },
          '&.MuiButton-containedPrimary:hover': {
            boxShadow: '0 10px 26px rgba(21, 58, 82, 0.22)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 13,
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiAccordion: {
      defaultProps: {
        disableGutters: true,
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #DCE4E9',
          borderRadius: '14px !important',
          overflow: 'hidden',
          marginBottom: 8,
          '&:before': { display: 'none' },
          '&.Mui-expanded': { marginBottom: 8 },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
  },
});
