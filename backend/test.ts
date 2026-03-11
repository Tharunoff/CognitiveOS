import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.listen(5001, () => {
    console.log("Listening on 5001");
});
