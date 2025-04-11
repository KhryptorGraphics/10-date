import * as React from 'react';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  useEffect(() => {
    // TODO: Replace with actual user ID/token
    fetch('http://localhost:3000/api/user/me')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setAge(data.age.toString());
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/user/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age: Number(age) }),
      });
      const data = await response.json();
      console.log('Profile updated:', data);
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Profile</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
        <button type="submit">Save</button>
      </form>
    </div>
  );
}
