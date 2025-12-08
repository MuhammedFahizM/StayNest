import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true); // NEW

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRefresh = localStorage.getItem("refresh_token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setRefreshToken(storedRefresh);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false); // FINISH LOADING
  }, []);

  const loginUser = (data) => {
    const newUser = {
      full_name: data.full_name,
      email: data.email,
      role: data.role,
    };

    setUser(newUser);
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, refreshToken, loginUser, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
