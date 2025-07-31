'use client';  // Ensure this is a Client Component

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';  // Import Image for optimization

type UserProfile = {
  name: string;
  email: string;
  profilePicture: string;
  fitnessGoals?: string;
};

const UserProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Fetch user profile data
    axios.get('/api/profile')
      .then(response => setProfile(response.data))
      .catch(() => {
        // Error handling if needed (not using the variable directly)
        console.error('Error fetching profile');
      });
  }, []);

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      {profile ? (
        <div className="profile-details">
          <Image
            src={profile.profilePicture || '/images/default-user.jpg'}
            alt="Profile Picture"
            width={150}
            height={150}
            className="profile-img"
          />
          <div className="profile-info">
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Fitness Goals:</strong> {profile.fitnessGoals || 'N/A'}</p>
          </div>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default UserProfilePage;
