import { useEffect, useState } from "react";
import { getUserProfile } from "../services/userService";
import ProfileDisplayCard from "../components/ProfileDisplayCard";


export default function UserProfileView() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getUserProfile().then(setProfile);
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
    title="User Profile"
    showBack={true}
    backPath="/user/dashboard"
    showEdit={true}
    editPath="/user/profile/edit"
  />
);

}
