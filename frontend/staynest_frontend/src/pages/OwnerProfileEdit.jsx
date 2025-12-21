import { useState, useEffect } from "react";
import { getOwnerProfile, updateOwnerProfile } from "../services/ownerService";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


export default function OwnerProfileEdit() {
    const [form, setForm] = useState({});
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { updateUser } = useContext(AuthContext);


    useEffect(() => {
        getOwnerProfile().then(setForm);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            ["full_name", "phone", "address"].forEach(
                (f) => form[f] && data.append(f, form[f])
            );
            if (file) data.append("profile_photo", file);

            await updateOwnerProfile(data);

            // 🔑 Fetch latest profile from backend
            const updatedProfile = await getOwnerProfile();

            // 🔑 Sync AuthContext (navbar updates instantly)
            updateUser({
                full_name: updatedProfile.full_name,
                profile_image: updatedProfile.profile_photo,
            });

            navigate("/owner/profile");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 pt-28 px-4">
            <div className="max-w-3xl mx-auto">

                <form
                    onSubmit={handleSubmit}
                    className="bg-white/70 backdrop-blur-xl border border-white/70 rounded-2xl shadow-lg p-8"
                >
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                        Edit Profile
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* FULL NAME */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={form.full_name || ""}
                                onChange={(e) =>
                                    setForm({ ...form, full_name: e.target.value })
                                }
                                className="w-full p-3 rounded-lg bg-white/80 border border-gray-300 text-gray-800"
                            />
                        </div>

                        {/* EMAIL (READ-ONLY) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email || ""}
                                disabled
                                className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        {/* PHONE */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="text"
                                value={form.phone || ""}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                                className="w-full p-3 rounded-lg bg-white/80 border border-gray-300 text-gray-800"
                            />
                        </div>

                        {/* STATUS (READ-ONLY) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Status
                            </label>
                            <input
                                type="text"
                                value={
                                    form.is_owner_approved ? "Approved" : "Pending Approval"
                                }
                                disabled
                                className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        {/* ADDRESS */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <textarea
                                rows={3}
                                value={form.address || ""}
                                onChange={(e) =>
                                    setForm({ ...form, address: e.target.value })
                                }
                                className="w-full p-3 rounded-lg bg-white/80 border border-gray-300 text-gray-800"
                            />
                        </div>

                        {/* PROFILE PHOTO */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Profile Photo
                            </label>
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="w-full text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                JPG or PNG. Square images work best.
                            </p>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-8 flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="
                px-6 py-2 rounded-xl
                bg-blue-500 text-white font-semibold
                hover:bg-blue-600 transition
                disabled:opacity-50
              "
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/owner/profile")}
                            className="text-gray-600 hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
