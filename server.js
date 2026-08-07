const app = require("./app");
const env = require("./config/env");
const connectDB = require("./db/connectDB");

const start = async () => {
    try {
        await connectDB();
        app.listen(env.port, () => {
            console.log(`Server is running on port ${env.port}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
};

start();
