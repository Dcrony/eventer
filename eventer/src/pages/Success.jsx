import "./CSS/home.css"

export default function Success() {
  return (
    <div className="home" >
      <h1>🎉 Payment Successful!</h1>
      <p>Your ticket has been created.</p>
      <a href="/my-tickets">View My Tickets</a>
    </div>
  );
}
