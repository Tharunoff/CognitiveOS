const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
app.listen(5002, () => console.log("Javascript Server Listening on 5002"));
