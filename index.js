const express = require('express');
const connectDB = require('./config/db');

const app = express();

//Connect to Database
connectDB();

app.use(express.json({ extended:false }));

//Define Routes
app.use('/',require('./routes/index'));
app.use('/api/url',require('./routes/url'));

const PORT = process.env.PORT || 5000

app.listen(PORT,() => {console.log(`Server Running on port ${PORT}`)});

module.exports = app;