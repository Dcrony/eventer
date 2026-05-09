const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect("mongodb+srv://dcrony:.Majeed244@cluster0.z8z1c7e.mongodb.net/tickispotDBtest?retryWrites=true&w=majority");

(async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await User.create({
       name: 'Admin User',
      username: "tickispotadmin",
      bio: "Official administrator account for TickiSpot platform",
      email: "admin@tickispot.com",
      phone: "+2348000000000",
      password: hashedPassword,
      role: 'admin',
        location: "Tickispot Headquarters",
        
    });

    console.log("✅ Admin created:", admin.email);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
