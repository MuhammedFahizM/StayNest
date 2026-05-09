import { useEffect, useState } from "react";
import { getOwnerProfile } from "../services/ownerService";
import ProfileDisplayCard from "../components/ProfileDisplayCard";


export default function OwnerProfileView() {
  const [profile, setProfile] = useState(null);
    
  useEffect(() => {
    getOwnerProfile().then(setProfile);
  }, []);

  if (!profile) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-secondary">
        Loading profile...
      </div>
    );
  }


    return (
  <ProfileDisplayCard
    profile={profile}
    title="Owner Profile"
    showBack={true}
    backPath="/owner/dashboard"
    showEdit={true}
    editPath="/owner/profile/edit"
  />
);

}
