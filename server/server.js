require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const certificateRoutes = require("./routes/certificateRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Get the absolute path to the project root
const projectRoot = path.join(__dirname, '..');

// Serve static files
app.use(express.static(path.join(projectRoot, 'public')));
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));

/* MongoDB Connection */
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((error) => {
    console.log("Database connection error:", error);
});

/* Routes */
app.use("/certificates", certificateRoutes);

/* Serve index.html */
app.get("/", (req, res) => {
    res.sendFile(path.join(projectRoot, 'public', 'index.html'));
});

/* Server Port */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Project root: ${projectRoot}`);
    console.log(`Uploads folder: ${path.join(projectRoot, 'uploads')}`);
});