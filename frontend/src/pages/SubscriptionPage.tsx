import * as React from 'react';
import { useState } from 'react';

export default function SubscriptionPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 999, currency: 'usd' }),
      });
      const data = await response.json();
      console.log('Payment intent:', data);
      setClientSecret(data.client_secret);
      // TODO: Use Stripe.js to complete payment
    } catch (error) {
      console.error('Payment intent error:', error);
    }
  };

  return (
    <div>
      <h2>Premium Subscription</h2>
      <p>Subscribe to unlock premium features!</p>
      <button onClick={handleSubscribe}>Subscribe Now</button>
      {clientSecret && <p>Client secret: {clientSecret}</p>}
    </div>
  );
}
