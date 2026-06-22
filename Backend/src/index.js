import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { server } from './app.js';

dotenv.config({ path: './.env' });

connectDB()
.then(() => {
    const PORT = process.env.PORT || 7000;
    server.listen(PORT, () => {
        console.log(`Main API server running on port ${PORT}`);
    });
})
.catch((e) => {
    console.log(`mongodb connection error ${e}`);
});