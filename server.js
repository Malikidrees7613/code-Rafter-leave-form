// http://localhost:3000
const app = require("./app");

const PORT = 3000;
const start = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.log("Error starting server", err);
    }
}


start();