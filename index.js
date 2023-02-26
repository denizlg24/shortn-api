const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();

//Connect to Database
connectDB();

const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}


app.use(cors(corsOptions));

app.use(express.json({ extended:false }));

//Define Routes
app.use('/',require('./routes/index'));
app.use('/api/url',require('./routes/url'));

const PORT = process.env.PORT || 5000

app.listen(PORT,() => {console.log(`Server Running on port ${PORT}`)});

module.exports = app;