const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// correction

require("dotenv").config(); // mon serveur peut à présent utilise les variables contenues dans .env

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

// import de mes router
const userRouter = require("./routes/user");
const offerRouter = require("./routes/offer");

app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur Vinted" });
});

// utilisation de mes router
app.use(userRouter);
app.use(offerRouter);

app.all("*", (req, res) => {
  res.status(404).json({ error: "all route" });
});

app.listen(process.env.PORT, () => {
  console.log("Server Started 🩲");
});
