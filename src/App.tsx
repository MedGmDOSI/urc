import {BrowserRouter, Navigate, Outlet, Route, Routes, useLocation} from "react-router-dom";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import {useSessionStore} from "./store/sessionStore";
import {Login} from "./user/Login";
import {Register} from "./user/Register";
import {Messenger} from "./messages/Messenger";

const theme = createTheme({
    cssVariables: true,
    colorSchemes: {
        // UBO identity : yellow #FEDB2A + black #181518.
        // Light mode : black is "primary" (readable text/links/buttons), yellow is "secondary" (brand surfaces).
        // Dark mode : yellow is readable on dark, so it is the primary colour too.
        light: {
            palette: {
                primary: {main: "#181518", contrastText: "#ffffff"},
                secondary: {main: "#FEDB2A", contrastText: "#181518"},
                background: {default: "#f7f5ec"},
            },
        },
        dark: {
            palette: {
                primary: {main: "#FEDB2A", contrastText: "#181518"},
                secondary: {main: "#FEDB2A", contrastText: "#181518"},
            },
        },
    },
    shape: {borderRadius: 10},
    typography: {fontFamily: "'Roboto', 'Segoe UI', system-ui, sans-serif"},
});

/** Only reachable when connected, otherwise redirects to the login page and comes back after */
function RequireAuth() {
    const session = useSessionStore(state => state.session);
    const location = useLocation();
    if (!session) {
        return <Navigate to="/login" replace state={{from: location.pathname}}/>;
    }
    return <Outlet/>;
}

/** Login / register pages are useless when already connected */
function RequireAnonymous() {
    const session = useSessionStore(state => state.session);
    return session ? <Navigate to="/messages" replace/> : <Outlet/>;
}

function App() {
    return (
        <ThemeProvider theme={theme} defaultMode="system">
            <CssBaseline/>
            <BrowserRouter>
                <Routes>
                    <Route element={<RequireAnonymous/>}>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/register" element={<Register/>}/>
                    </Route>
                    <Route element={<RequireAuth/>}>
                        <Route path="/messages" element={<Messenger/>}/>
                        <Route path="/messages/:type/:id" element={<Messenger/>}/>
                    </Route>
                    <Route path="*" element={<Navigate to="/messages" replace/>}/>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
