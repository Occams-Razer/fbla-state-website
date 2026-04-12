import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    primary:    { main: "#ef7400", dark: "#dc6b00", light: "#f8d6b3" },
    success:    { main: "#12a44b" },
    error:      { main: "#dc4141" },
    warning:    { main: "#a87a00" },
    info:       { main: "#2e6cd6" },
    background: { default: "#fff6e5", paper: "#ffffff" },
    text: {
      primary:   "#2a2a2a",
      secondary: "rgba(42,42,42,0.72)",
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      'var(--font-metropolis),"Avenir Next","Segoe UI","Inter","Helvetica Neue",Helvetica,Arial,sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
  components: {
    MuiButtonBase: {
      defaultProps: { disableRipple: false },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontFamily: "inherit" },
      },
    },
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      },
    },
    MuiSkeleton: {
      defaultProps: { animation: "wave" },
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "rgba(42,42,42,0.08)",
          "&::after": { background: "linear-gradient(90deg,transparent,rgba(42,42,42,0.06),transparent)" },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#2a2a2a",
          fontSize: "0.78rem",
          fontFamily: "inherit",
          borderRadius: 6,
          padding: "5px 10px",
        },
        arrow: { color: "#2a2a2a" },
      },
    },
  },
});
