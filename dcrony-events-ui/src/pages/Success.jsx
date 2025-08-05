import "./CSS/home.css"

export default function Success() {
  return (
    <div className="home" style={{ padding: '30px', textAlign: 'center' }}>
      <h1>🎉 Payment Successful!</h1>
      <p>Your ticket has been created.</p>
      <a href="/tickets">View My Tickets</a>
    </div>
  );
}
