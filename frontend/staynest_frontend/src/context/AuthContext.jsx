import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------------------
     Load auth state from localStorage on app start
  --------------------------------------------------- */
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRefresh = localStorage.getItem("refresh_token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setRefreshToken(storedRefresh);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  /* ---------------------------------------------------
     Login user (called after successful login API)
  --------------------------------------------------- */
  const loginUser = (data) => {
    const newUser = {
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      profile_image: data.profile_image || null,
      phone: data.phone || "",
    };

    setUser(newUser);
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  /* ---------------------------------------------------
     Update user fields (used after profile edit)
     This keeps navbar & UI in sync instantly
  --------------------------------------------------- */
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;

      const updatedUser = { ...prev, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  /* ---------------------------------------------------
     Logout
  --------------------------------------------------- */
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
      value={{
        user,
        token,
        refreshToken,
        loginUser,
        updateUser, // ✅ exposed for profile updates
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
