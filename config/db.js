const mongoose = require("mongoose");
const db = "mongodb+srv://denizlg24:tlPZepRbCa41z90r@shortn-cluster.q5wkw8s.mongodb.net/?retryWrites=true&w=majority"

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
    });
    console.log("Mongo DB Connected...")
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
