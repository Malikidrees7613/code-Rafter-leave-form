const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const User = require("../models/UserSchema");
const { jwt: jwtConfig } = require("../config/env");

const protect = async (req, res, next) => {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;

        if (!token) {
            return next(new ApiError("You are not logged in. Please log in to continue.", 401));
        }

        let decoded;
        try {
            decoded = jwt.verify(token, jwtConfig.secret);
        } catch (error) {
            return next(new ApiError("Invalid or expired token. Please log in again.", 401));
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new ApiError("The user belonging to this token no longer exists.", 401));
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return next(new ApiError("You do not have permission to perform this action.", 403));
    }
    next();
};

module.exports = { protect, restrictTo };
