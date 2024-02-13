const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://localhost:27017/Login");

// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch(() => {
    console.log("Database cannot be Connected");
})

// Create Schema
const Loginschema = new mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },

    // role: {
    //     type: String,
    //     enum: ['client', 'technician'], // Possible values for role
    //     required: true
    // }
    


});

// collection part
const collection = new mongoose.model("users", Loginschema);

module.exports = collection;
