'use client';  // Ensure this is a Client Component

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';  // Import Image for optimization

type CoachProfile = {
  name: string;
  email: string;
  profilePicture: string;
  specialization?: string;
};

const CoachProfilePage = () => {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');  // Get token from localStorage

        if (!token) {
          setError('Coach is not authenticated');
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
      <h2>Coach Profile</h2>
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
            <p><strong>Specialization:</strong> {profile.specialization || 'Not specified'}</p>
          </div>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default CoachProfilePage;
