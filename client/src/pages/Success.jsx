import "./CSS/home.css"

export default function Success() {
  return (
    <div className="home flex justify-center items-center p-40 bg-black" >
      <h1 className="font-bold font-70 text-xl">🎉 Payment Successful!</h1>
      <p>Your ticket has been created.</p>
      <a href="/my-tickets">View My Tickets</a>
    </div>
  );
}
