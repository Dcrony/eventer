import React from 'react';
import API from '../api/axios'; // adjust if yours is in a different path
import { useSelector } from 'react-redux'; // or however you get the logged-in user

const EventDetail = ({ event, quantity }) => {
  const user = useSelector((state) => state.auth.user); // make sure user is available

  const payNow = async () => {
    try {
      const res = await API.post('/payment/initiate', {
        email: user.email,
        amount: event.ticketPrice * quantity,
        metadata: {
          eventId: event._id,
          userId: user._id,
          quantity
        }
      });
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      alert('Payment failed to start');
    }
  };

  return (
    <div className='home'>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p>Price: ₦{event.ticketPrice}</p>

      {/* You can let the user choose how many tickets to buy */}
      <button onClick={payNow}>Pay with Paystack</button>
    </div>
  );
};

export default EventDetail;
