const path = require("path");
const express = require("express");
const multer = require("multer");
const ApiError = require("./utils/ApiError");
const authRoute = require("./routes/authRoute");
const LeaveRoute = require("./routes/LeaveRoute");
const UserRoute = require("./routes/UserRoute");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoute);
app.use("/api/leave", LeaveRoute);
app.use("/api/users", UserRoute);

app.get("/", (req, res) => {
    res.redirect("/SignIn.html");
});

app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({ message: "Invalid file type. Only PDF, JPG, PNG and WEBP files are allowed." });
        }
        return res.status(400).json({ message: err.message || "File upload failed." });
    }

    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(", ") });
    }

    if (err.name === "CastError") {
        return res.status(400).json({ message: `Invalid value for ${err.path}.` });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "field";
        return res.status(409).json({ message: `${field} already exists.` });
    }

    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Something went wrong on the server." });
});

module.exports = app;
