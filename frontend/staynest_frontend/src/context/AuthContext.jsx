import { createContext, useState } from "react";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Save user and token when login is successful
    const loginUser = (data) => {
        setUser(data);
        setToken(data.access_token);

        // Save token in localStorage so axios can use it
        localStorage.setItem("access_token", data.access_token);
    };

    // Logout function
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("access_token");
    };

    return (
        <AuthContext.Provider value={{ user, token, loginUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
