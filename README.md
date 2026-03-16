🎟️ TickiSpot
TickiSpot is a modern event management and ticketing platform that allows users to discover events, purchase digital tickets, and attend live experiences. Organizers can create events, sell tickets, manage attendees, and track earnings — all from a powerful dashboard.
The platform also includes QR ticket validation, live streaming, withdrawal management, and admin analytics.
🚀 Features
🎫 Ticketing System
Digital ticket generation
QR code ticket validation
Secure ticket purchase
Ticket download & management
🎤 Event Management
Create and edit events
Upload event images
Event categories and locations
Live event streaming support
👤 User Dashboard
Manage purchased tickets
Transaction history
Event access and chat
Profile management
🧑‍💼 Organizer Tools
Event analytics
Revenue tracking
Withdrawal requests
Ticket scanner for entry validation
🛠️ Admin Dashboard
User management
Withdrawal approvals
Platform analytics
Payout tracking
💳 Payment & Finance
Organizer withdrawals
Transaction records
Platform fee tracking
🌙 Modern UI
Responsive design
Dark mode support
Mobile-friendly interface
🧰 Tech Stack
Frontend
React
Vite
React Router
Lucide Icons
CSS Modules / Custom CSS
Backend
Node.js
Express.js
MongoDB
Mongoose
Other Tools
JWT Authentication
QR Code Generation
Axios API Client
📂 Project Structure
Copy code

tickispot/
│
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── api/
│   │   └── utils/
│
├── server/                # Express backend
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── middleware/
│
└── README.md
⚙️ Installation
1️⃣ Clone the Repository
Bash
Copy code
git clone https://github.com/yourusername/tickispot.git
cd tickispot
2️⃣ Install Dependencies
Frontend:
Bash
Copy code
cd client
npm install
Backend:
Bash
Copy code
cd server
npm install
3️⃣ Setup Environment Variables
Create a .env file inside the server folder:
Copy code

PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
Frontend .env:
Copy code

VITE_API_URL=http://localhost:5000
4️⃣ Run the App
Start backend:
Bash
Copy code
cd server
npm run dev
Start frontend:
Bash
Copy code
cd client
npm run dev
🔐 Authentication
TickiSpot uses JWT-based authentication for secure access to:
User dashboards
Organizer tools
Admin routes
Protected routes require a valid token in request headers.

🌍 Future Improvements
Mobile app version
Advanced event analytics
Email ticket delivery
Stripe/Paystack integration
Multi-organizer team support
Real-time attendee analytics
🤝 Contributing
Contributions are welcome!
Fork the repository
Create a feature branch
Commit your changes
Submit a Pull Request
📜 License
This project is licensed under the MIT License.
👨‍💻 Author
TickiSpot Team
Building the future of event ticketing.