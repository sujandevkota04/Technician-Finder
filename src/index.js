const express = require('express');
const pasth = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");

const app = express();
// convert data into json 
app.use(express.json());
app.use(express.urlencoded({extended: false}));


// use EJS as the view engine
app.set('view engine', 'ejs');

// static file
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("login");
})  
app.get("/signupt", (req, res) => {
    res.render("signupt");
})
app.get("/signupc", (req, res) => {
    res.render("signupc");
})

app.get("/home", (req, res) => {
    res.render("home");
})
app.get("/t_profile", (req, res) => {
    res.render("t_profile");
})

// Register technician
app.post("/signupt", async(req, res) => {
    const data = {
        name: req.body.contactNo,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.location
    }
    //Checks if the user already exists in the database
    const existingUser = await collection.findOne({name: data.name});
    if(existingUser){
        res.send("User already exists. Choose different username.");
    }
    else{
        //Hash Password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;
        
        const userdata = await collection.insertMany(data);
        console.log(userdata);
    }

});


// Register client
app.post("/signupc", async(req, res) => {
    const data = {
        name: req.body.contactNo,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.location
    }
    //Checks if the user already exists in the database
    const existingUser = await collection.findOne({name: data.name});
    if(existingUser){
        res.send("User already exists. Choose different username.");
    }
    else{
        //Hash Password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;
        
        const userdata = await collection.insertMany(data);
        console.log(userdata);
    }

});

//Login client 
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            res.send("User name cannot found")
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



// // //login technician
// app.post("/login", async (req, res) => {
//     try {
//         const check = await collection.findOne({ name: req.body.username });
//         if (!check) {
//             res.send("User name cannot found")
//         }
//         // Compare the hashed password from the database with the plaintext password
//         const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
//         if (!isPasswordMatch) {
//             res.send("wrong Password");
//         }
//         else {
//             res.render("t_profile");
//         }
//     }
//     catch {
//         res.send("wrong Details");
//     }
// });




// Define Port for Application
const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});