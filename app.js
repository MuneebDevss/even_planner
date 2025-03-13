const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(process.env.Mongo_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.error("Error connecting to DB:", err);
    });

// Event schema
const eventSchema = new mongoose.Schema({
    name: String,
    description: String,
    date: Date,
    time: String,
    category: String,
    user_id: String,
    setReminder: Boolean,
});

const EventModel = mongoose.model("Event", eventSchema);

// User schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const UserModel = mongoose.model("User", userSchema);

// Authentication middleware
const authenticateUser = (req, res, next) => {
    if (req.headers.authorization) {
        const auth = req.headers.authorization;
        const token = auth.split(" ")[1];
        try {
            const user = jwt.verify(token, process.env.SECRET_KEY);
            req.user = user;
            next();
        } catch (err) {
            res.status(400).send({ message: "Invalid Token" });
        }
    } else {
        res.status(400).send({ message: "Empty Token" });
    }
};

// Signup route
app.post("/signup", async (req, res) => {
    try {
        const user = new UserModel(req.body);
        const token = jwt.sign({ email: user.email }, process.env.SECRET_KEY);
        await user.save();
        res.send({ message: "User Created", token: token });
    } catch (error) {
        res.status(400).send({ message: "Error while creating user" });
    }
});

// Create event route
app.post("/event/add", authenticateUser, async (req, res) => {
    try {
        const { name, description, date, time, category } = req.body;
        const newEvent = new EventModel({
            name,
            description,
            date,
            time,
            category,
            user_id: req.user._id,
            setReminder: false,
        });
        await newEvent.save();
        res.send({ message: "Event created successfully" });
    } catch (error) {
        res.status(400).send({ message: "Error while saving the event" });
    }
});

// Get upcoming events sorted by date
app.get("/event", authenticateUser, async (req, res) => {
    try {
        const currentDate = new Date();
        const events = await EventModel.find({ date: { $gte: currentDate }, user_id: req.user._id }).sort({ date: 1 });
        res.send(events);
    } catch (error) {
        res.status(400).send({ message: "Error while fetching events" });
    }
});

// Add reminder
app.post("/reminder/add", authenticateUser, async (req, res) => {
    try {
        const event = await EventModel.findById(req.body.event_id);
        if (event) {
            event.setReminder = true;
            await event.save();
            res.send({ message: "Reminder added successfully" });
        } else {
            res.status(404).send({ message: "Event not found" });
        }
    } catch (error) {
        res.status(400).send({ message: "Error while saving the reminder" });
    }
});

// Get reminders
app.get("/reminder", authenticateUser, async (req, res) => {
    try {
        const currentDate = new Date();
        const events = await EventModel.find({ date: { $gte: currentDate }, user_id: req.user._id, setReminder: true }).sort({ date: 1 });
        res.send(events);
    } catch (error) {
        res.status(400).send({ message: "Error while fetching reminders" });
    }
});

// Start the server
app.listen(3000, () => {
    console.log("Server started at 3000");
});