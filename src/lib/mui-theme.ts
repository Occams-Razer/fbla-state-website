import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    primary:    { main: "#ef7c00", dark: "#d56f00", light: "#eac08f" },
    success:    { main: "#35a24f" },
    error:      { main: "#f25d5f" },
    warning:    { main: "#e0bf44" },
    info:       { main: "#4f73d8" },
    background: { default: "#e8e1d2", paper: "#f1ece2" },
    text: {
      primary:   "#2c2d31",
      secondary: "rgba(44,45,49,0.64)",
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      '"Avenir Next","Nunito Sans","Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif',
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
          backgroundColor: "rgba(44,45,49,0.09)",
          "&::after": { background: "linear-gradient(90deg,transparent,rgba(44,45,49,0.08),transparent)" },
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
