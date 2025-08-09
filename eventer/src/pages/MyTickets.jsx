import { useEffect, useState } from 'react';
import API from '../api/axios';
import "./CSS/home.css"

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    API.get('/events/my-tickets')
      .then(res => setTickets(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className='home'>
      <h2>🎟️ My Tickets</h2>
      {tickets.length === 0 ? (
        <p>You haven't purchased any tickets yet.</p>
      ) : (
        tickets.map(ticket => (
          <div key={ticket._id} style={{ border: '1px solid #ddd', margin: '10px', padding: '10px' }}>
            <h3>{ticket.event.title}</h3>
            <p>Quantity: {ticket.quantity}</p>
            <p>Date: {ticket.event.date} • Location: {ticket.event.location}</p>
            {ticket.event.liveStream?.isLive && (
              <p>
                <a href={ticket.event.liveStream.streamURL} target="_blank" rel="noreferrer">
                  🔴 Watch Live
                </a>
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
