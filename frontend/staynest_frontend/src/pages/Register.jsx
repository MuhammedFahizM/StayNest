import { useState } from "react";

export default function Register() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [role, setRole] = useState("user");




    const handleSubmit = (e) => {
        e.preventDefault();

        if (!fullName || !email || !password || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        console.log("Full Name:", fullName);
        console.log("Email:", email);
        console.log("Password:", password);

        setError("");
        alert("Register form submitted (Backend integration soon)");
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Register</h2>

            <form onSubmit={handleSubmit}>

                <div style={{ marginBottom: "10px" }}>
                    <label>Full Name:</label><br />
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{ width: "250px", padding: "8px" }}
                    />
                </div>

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


                <div style={{ marginBottom: "10px" }}>
                    <label>Confirm Password:</label><br />

                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ width: "250px", padding: "8px" }}
                    />

                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                            marginLeft: "10px",
                            padding: "5px 10px",
                            cursor: "pointer"
                        }}
                    >
                        {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                </div>

                <div style={{ marginBottom: "10px" }}>
                    <label>Select Role:</label><br />
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={{ width: "250px", padding: "8px" }}
                    >
                        <option value="user">User</option>
                        <option value="owner">Owner</option>
                    </select>
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
                    Register
                </button>
            </form>
        </div>
    );
}
