const express = require('express');
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");
const session = require('express-session');
const crypto = require('crypto');

// const { Collection } = require('mongoose');
// const { render } = require('ejs');
// const { data } = require('jquery');

const app = express();


// convert data into json 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// use EJS as the view engine
app.set('view engine', 'ejs');

// static file
app.use(express.static("public"));
// app.use(express.static("images"));


app.get("/", (req, res) => {
    res.render("login");
})
app.get("/signupt", (req, res) => {
    res.render("signupt");
})
app.get("/signupc", (req, res) => {
    res.render("signupc");
})


// Register technician
app.post("/signupt", async (req, res) => {
    const data = {
        name: req.body.contactNo,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.location,
        service: req.body.service,
        role: 'technician'
    }
    //Checks if the user already exists in the database
    const existingUser = await collection.findOne({ name: data.name });
    if (existingUser) {
        res.send("User already exists. Choose different username.");
    }
    else {
        //Hash Password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;

        // const userdata = await collection.insertMany(data);
        // console.log(userdata);
        // res.render("t_profile");

        const newTechnician = await collection.create(data);
        res.redirect(`/t_profile/${newTechnician._id}`);
    }

});


// Register client
app.post("/signupc", async (req, res) => {
    const data = {
        name: req.body.contactNo,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.location,
        role: 'client'
    }
    //Checks if the user already exists in the database
    const existingUser = await collection.findOne({ name: data.name });
    if (existingUser) {
        res.send("User already exists. Choose different username.");
    }
    else {
        //Hash Password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;

        const userdata = await collection.insertMany(data);
        console.log(userdata);
        res.render("home");
    }
});


/*
//Login client 
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            // If user not found, send message with option to go to login page
            res.send("User name cannot be found. <br><a href='/' style='color: blue; text-decoration: underline; cursor: pointer;'>Go to login page</a>");
            return; // Stop execution here to prevent further code execution
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            res.send("wrong Password");
        }
        else {
            res.render("home");
        }
    }
    catch {
        res.send("wrong Details");
    }
});
*/







/*Added code*/
//Login client & technician
app.post("/login", async (req, res) => {
    try {
        // Find user based on username
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            // If user not found, send message with option to go to login page
            res.send("User name cannot be found. <br><a href='/' style='color: blue; text-decoration: underline; cursor: pointer;'>Go to login page</a>");
            return; // Stop execution here to prevent further code execution
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            res.send("Wrong Password");
        }
        else {
            // Redirect user to the appropriate page based on role
            //Finding/Retrieving the value of role field from database
            // const user = await collection.findOne({ name: req.body.username });
            const role = check.role;
            if (role === 'client') {
                res.render("home");
            } else if (role === 'technician') {
                return res.redirect(`/t_profile/${check._id}`);
            } else {
                res.status(400).send("Invalid role");
            }
            // res.render("home");
        }

    } catch {
        res.send("Wrong Details");
    }
});






// // Login route for both client and technician
// app.post("/login", async (req, res) => {
//     try {
//         const { username, password, role } = req.body;

//         // Ensure username, password, and role are provided
//         if (!username || !password || !role) {
//             res.status(400).send("Username, password, and role are required");
//             return;
//         }

//         // Find user based on username and role
//         const check = await collection.findOne({ name: req.body.username});

//         // Check if user exists
//         if (!check) {
//             res.status(404).send("User not found");
//             return;
//         }

//         // Compare the hashed password from the database with the plaintext password
//         const isPasswordMatch = await bcrypt.compare(password, user.password);
//         if (!isPasswordMatch) {
//             res.status(401).send("Incorrect password");
//             return;
//         }

//         // Redirect user to the appropriate page based on role
//         if (role === 'client') {
//             res.render("home");
//         } else if (role === 'technician') {
//             res.render("t_profile");
//         } else {
//             res.status(400).send("Invalid role");
//         }
//     } catch (error) {
//         console.error("Login error:", error);
//         res.status(500).send("Internal server error");
//     }
// });

//To show the technicians based on services
app.get("/technicians", async (req, res) => {
    try {
        //extract the service from the query parameters
        const service = req.query.service;
        //query the database for technicians offering the specified service
        const technicians = await collection.find({ service: service })
        //render a view with the list of technicians
        res.render("technician_list", { technicianlist: technicians, service: service })
    } catch (error) {
        console.error("Error retrieving technicians:", error)
        res.status(500).send("Internal server error")
    }
});

//Route to display the technician's profile after signup
app.get("/t_profile/:id", async (req, res) => {
    try {
        // const technician = await collection.findOne({ name: req.body.username });
        const technician = await collection.findById(req.params.id)
        if (technician) {
            res.render("t_profile", { techniciandata: technician })

        } else {
            res.status(404).send("Technician not found")
        }
    } catch (error) {
        console.error("Error fetching technician:", error)
        res.status(500).send("Internal server error")
    }
});







// Define Port for Application
const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});