import * as React from 'react';
import { useState, useEffect } from 'react';

export default function MatchPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3000/api/matching/recommendations')
      .then((res) => res.json())
      .then((data) => setProfiles(data));
  }, []);

  const handleSwipe = async (direction: 'like' | 'dislike') => {
    const profile = profiles[currentIndex];
    try {
      await fetch('http://localhost:3000/api/matching/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.id, direction }),
      });
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error('Swipe error:', error);
    }
  };

  if (currentIndex >= profiles.length) return <div>No more profiles</div>;

  const profile = profiles[currentIndex];

  return (
    <div>
      <h2>Discover</h2>
      <div>
        <p>{profile.name}, {profile.age}</p>
        <button onClick={() => handleSwipe('like')}>Like</button>
        <button onClick={() => handleSwipe('dislike')}>Dislike</button>
      </div>
    </div>
  );
}
