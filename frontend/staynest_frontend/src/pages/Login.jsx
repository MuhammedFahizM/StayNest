import { useState, useContext } from "react";
import { login } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const data = await login({
                email: email,
                password: password,
            });

            // Save user + token in context
            loginUser(data);

            alert("Login successful");

            // redirect owner
            if (data.role === "owner") {
                navigate("/owner/dashboard");
            } else {
                navigate("/");
            }
        } catch (err) {
            setError("Invalid email or password");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Login</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "10px" }}>
                    <label>Email:</label><br />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: "250px", padding: "8px" }}
                    />
                </div>

                <div style={{ marginBottom: "10px" }}>
                    <label>Password:</label><br />
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: "250px", padding: "8px" }}
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            marginLeft: "10px",
                            padding: "5px 10px",
                            cursor: "pointer"
                        }}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {error && (
                    <p style={{ color: "red" }}>{error}</p>
                )}

                <button
                    type="submit"
                    style={{
                        padding: "8px 20px",
                        backgroundColor: "black",
                        color: "white",
                        border: "none",
                        cursor: "pointer"
                    }}
                >
                    Login
                </button>
            </form>
        </div>
    );
}
