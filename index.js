const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();

//Connect to Database
connectDB();

let corsOrigins=[];

if(process.env.REQUEST_ORIGIN){
    corsOrigins=[process.env.REQUEST_ORIGIN];
}
else{
    corsOrigins=["http://localhost:5173"];
}
const corsOptions = {
    origin: corsOrigins,
    methods:['POST'],
    allowedHeaders: ['Content-Type', 'application/json']   
};


app.use(cors(corsOptions));

app.use(express.json({ extended:false }));

//Define Routes
app.use('/',require('./routes/index'));
app.use('/api/url',require('./routes/url'));

const PORT = process.env.PORT || 5000

app.listen(PORT,() => {console.log(`Server Running on port ${PORT}`)});

module.exports = app;