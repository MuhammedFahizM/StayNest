import { useEffect, useState } from "react";
import { ownerDashboard } from "../services/authService";

export default function OwnerDashboard() {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await ownerDashboard();
                setMessage(data.message);
            } catch (error) {
                // Show error from backend
                setMessage(error.response?.data?.error || "Something went wrong");
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        return <h2>Loading...</h2>;
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>Owner Dashboard</h1>
            <p>{message}</p>
        </div>
    );
}
