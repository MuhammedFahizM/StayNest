import { createContext, useState } from "react";
import { flushSync } from "react-dom";
import axios from "axios";

export const AuthContext = createContext();


export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);   // Normal user
    const [owner, setOwner] = useState(null);  // Pg/hostel owner
    const [token, setToken] = useState(null);  // JWT

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
    };

    const ownerLogin = (ownerData, jwtToken) => {
        setOwner(ownerData);
        setToken(jwtToken);
    };

    const logout = () => {
        setUser(null);
        setOwner(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, owner, token, login, ownerLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );


}



const API_URL = "http://localhost:8000/api/accounts";

export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login/`, {
        email,
        password
    });
    return response.data;
};

export const register = async (fullName, email, password) => {
    const response = await axios.post(`${API_URL}/register/`, {
        full_name: fullName,
        email,
        password
    });
    return response.data;
};

