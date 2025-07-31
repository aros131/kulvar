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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');  // Get token from localStorage

        if (!token) {
          setError('User is not authenticated');
          return;
        }

        const response = await axios.get('https://kulvar-qb7t.onrender.com/profile', {
          headers: {
            Authorization: `Bearer ${token}`,  // Attach token in Authorization header
          },
        });

        setProfile(response.data);
      } catch (err) {
        setError('Error fetching profile');
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
