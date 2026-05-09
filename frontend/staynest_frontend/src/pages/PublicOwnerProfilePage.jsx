import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import ProfileDisplayCard from "../components/ProfileDisplayCard";

export default function PublicOwnerProfilePage() {
  const { ownerId } = useParams();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(
          `/accounts/public/owner/${ownerId}/`
        );
        setProfile(res.data);
      } catch {
  navigate(-1);
}
    };

    fetchProfile();
  }, [ownerId]);

  if (!profile) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div className="spinner-border"></div>
    </div>
  );
}

  return (
    <ProfileDisplayCard
      profile={profile}
      title="Owner Profile"
      showBack={true}
      backPath={-1}
      showEdit={false}
    />
  );
}
