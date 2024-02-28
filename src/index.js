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

// Generate a random string of 32 characters
const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Secret key:', secretKey);
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
}));
// Middleware function to check if the user is logged in
function requireLogin(req, res, next) {
    if (req.session.user) {
        // User is logged in, proceed to the next middleware
        next();
    } else {
        // User is not logged in, redirect to login page or send an error response
        // res.status(401).send("Unauthorized: User must be logged in to access this resource");
        res.redirect("/")
    }
}




// convert data into json 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// use EJS as the view engine
app.set('view engine', 'ejs');

// static file
app.use(express.static("public"));
// app.use(express.static("images"));


app.get("/", (req, res) => {
    // Set cache-control headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.render("login");
})
app.get("/signupt", (req, res) => {
    res.render("signupt");
})
app.get("/signupc", (req, res) => {
    res.render("signupc");
})
// Home page route with authentication check
app.get("/home", requireLogin, async (req, res) => {
    // Set cache-control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Render the home page
    res.render("home");
    // res.render("home", { clientLocation: { latitude: req.query.latitude, longitude: req.query.longitude } });
});

//To show the technicians based on services
app.get("/technicians", requireLogin, async (req, res) => {
    try {
        //extract the service from the query parameters
        const service = req.query.service;
        //query the database for technicians offering the specified service
        const technicians = await collection.find({ service: service })
        //render a view with the list of technicians
        // res.render("technician_list", { technicianlist: technicians, service: service, clientLocation: { latitude: req.query.latitude, longitude: req.query.longitude} })
        res.render("technician_list", { technicianlist: technicians, service: service })
    } catch (error) {
        console.error("Error retrieving technicians:", error)
        res.status(500).send("Internal server error")
    }
});

//Route to display the technician's profile after signup
app.get("/t_profile/:id", requireLogin, async (req, res) => {
    try {
        // Set cache-control headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

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


// Register technician
app.post("/signupt", async (req, res) => {
    const data = {
        name: req.body.contactNo,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        // location: req.body.location,
        location: {
            type: "Point",
            coordinates: [parseFloat(req.body.latitude), parseFloat(req.body.longitude)]
        },

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

        // const newTechnician = await collection.create(data);
        // // res.redirect(`/t_profile/${newTechnician._id}`);

        // // Set the user session to authenticate the user
        // req.session.user = data;




        //Added Code
        const userdata = await collection.insertMany(data);
        console.log(userdata);
        // res.render("home");


        const userId = userdata[0]._id;
        // Set the user session
        req.session.user = {
            _id: userId,
            role: 'technician',
            name: data.name,
            firstName: data.firstName,
            lastName: data.lastName,
            location: data.location
        };



        // Redirect the user to the login page
        return res.redirect("/");
    }

});


// Register client
app.post("/signupc", async (req, res) => {
    const data = {
        name: req.body.contactNo,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        // location: req.body.location,
        location: {
            type: "Point",
            coordinates: [parseFloat(req.body.latitude), parseFloat(req.body.longitude)]
        },

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
        // res.render("home");


        const userId = userdata[0]._id;
        // Set the user session
        req.session.user = {
            _id: userId,
            role: 'client',
            name: data.name,
            firstName: data.firstName,
            lastName: data.lastName,
            location: data.location
        };

        // Set the user session to authenticate the user
        // req.session.user = data;

        // Redirect the user to the login page
        return res.redirect("/");
    }
});


/*Added code*/
//Login client & technician
app.post("/login", async (req, res) => {
    try {
        // Find user based on username
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            // If user not found, send message with option to go to login page
            return res.send("User name cannot be found. <br><a href='/' style='color: blue; text-decoration: underline; cursor: pointer;'>Go to login page</a>");
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            return res.send("Wrong Password");
        }
        else {


            // Set the user session
            req.session.user = {
                _id: check._id,
                role: check.role,
                name: check.name,
                firstName: check.firstName,
                lastName: check.lastName,
                location: check.location
            };

            // Redirect user to the appropriate page based on role
            //Finding/Retrieving the value of role field from database
            // const user = await collection.findOne({ name: req.body.username });
            if (check.role === 'client') {
                return res.redirect("/home");
                // Redirect the user to the "/home" route with the user ID as a query parameter
                // return res.redirect("/home?userId=" + check._id);

            } else if (check.role === 'technician') {
                return res.redirect(`/t_profile/${check._id}`);
            } else {
                return res.status(400).send("Invalid role");
            }
            // res.render("home");
        }

    } catch (error) {
        console.error(error);
        return res.status(500).send("Login failed due to an unexpected error. Please try again later.");
    }
});

// Logout route
app.post("/logout", (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Logout failed due to an unexpected error.");
        }
        // Redirect the user to the login page or any other appropriate page
        res.redirect("/");
    });
});















// Define Port for Application
const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});