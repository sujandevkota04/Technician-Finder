const express = require('express');
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");
const calculateDistance = require("./haversine_filter");
const session = require('express-session');
const crypto = require('crypto');
const utils = require("./utils");



const natural = require('natural');
const stemmer = natural.PorterStemmer;
const Analyzer = natural.SentimentAnalyzer;
const analyzer = new Analyzer("English", stemmer, "afinn");


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
// Serve static files from the '/src/images' directory
// app.use('/images', express.static(path.join(__dirname, 'Login', 'src', 'images')));
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
    const client = req.session.user._id;

    // Render the home page
    res.render("home", {
        client: client,
        generateInitialsImage: utils.generateInitialsImage
    });
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

        const technicianId = req.params.id;
        const technician = await collection.findById(technicianId);

        if (!technician) {
            return res.status(404).send("Technician not found");
        }

        // Check if the logged-in user is a technician
        if (req.session.user.role === 'technician') {
            // If technician, render the technician profile page without comment form
            return res.render("t_profile", { techniciandata: technician, allowComment: false });
        } else {
            // If not technician, render the technician profile page with comment form
            return res.render("t_profile", { techniciandata: technician, allowComment: true });
        }
    } catch (error) {
        console.error("Error fetching technician:", error);
        res.status(500).send("Internal server error");
    }
});

// Route to handle submission of new comments for the technician
app.post("/t_profile/:id/comment", requireLogin, async (req, res) => {
    try {
        const technicianId = req.params.id;
        const comment = req.body.comment;

        // Find the technician by ID and update the comments array
        await collection.findByIdAndUpdate(technicianId, { $push: { comments: comment } });

        // Redirect back to the technician's profile page after adding the comment
        res.redirect(`/t_profile/${technicianId}`);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).send("Internal server error");
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








//route to display the filtered list of technicians based on distance
app.get("/filter", requireLogin, async (req, res) => {
    try {
        const userLocation = req.session.user.location.coordinates;
        console.log("User Location:", userLocation);

        const service = req.query.service;
        console.log("Service:", service);

        // Check if service parameter is defined
        if (!service) {
            return res.status(400).send("Missing service parameter");
        }

        // Query the database for technicians offering the specified service
        const technicians = await collection.find({ service: service });
        console.log("Technicians:", technicians);

        // Calculate the distance between the user and each technician
        const techniciansWithDistance = technicians.map(technician => {
            const distance = calculateDistance(userLocation[1], userLocation[0], technician.location.coordinates[1], technician.location.coordinates[0]);
            return { ...technician.toObject(), distance };
        });

        // Sort the technicians based on distance from the user
        techniciansWithDistance.sort((a, b) => a.distance - b.distance);

        // Filter technicians within 5 km range
        const maxDistanceInMeters = 16;
        const techniciansWithinRange = techniciansWithDistance.filter(technician => technician.distance <= maxDistanceInMeters);

        console.log("Technicians with Distance:", techniciansWithDistance);
        res.render("filter_technician", {
            technicianlist: techniciansWithinRange,
            service: service,
            generateInitialsImage: utils.generateInitialsImage

        });


    } catch (error) {
        console.error("Error retrieving technicians:", error);
        res.status(500).send("Internal server error");
    }
});
module.exports = app;


// Route to render the user profile page
app.get("/c_profile", requireLogin, async (req, res) => {
    try {
        // Set cache-control headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        // Retrieve the user's data from the session
        const userId = req.session.user._id;

        // Query the database to fetch the user's data
        const userData = await collection.findById(userId);

        // Render the profile page with the user's data
        res.render("c_profile", { userData: userData });
    } catch (error) {
        console.error("Error retrieving user data:", error);
        res.status(500).send("Internal server error");
    }
});



// Function to calculate the average sentiment score
function calculateAverageSentiment(sentiments) {
    // Calculate the total sentiment score
    const totalSentiment = sentiments.reduce((total, score) => total + score, 0);

    // Calculate the average sentiment score
    const averageSentiment = sentiments.length > 0 ? totalSentiment / sentiments.length : 0;

    return averageSentiment;
}

// Route to handle sentiment analysis sorting of technicians based on comments
app.get("/sfilter", requireLogin, async (req, res) => {
    try {
        const userLocation = req.session.user.location.coordinates;
        const service = req.query.service;

        // Check if service parameter is defined
        if (!service) {
            return res.status(400).send("Missing service parameter");
        }

        // Query the database for technicians offering the specified service
        const technicians = await collection.find({ role: "technician", service: service });

        // Calculate the distance between the user and each technician
        const techniciansWithDistance = technicians.map(technician => {
            const distance = calculateDistance(userLocation[1], userLocation[0], technician.location.coordinates[1], technician.location.coordinates[0]);
            return { ...technician.toObject(), distance };
        });

        // Sort the technicians based on distance from the user
        techniciansWithDistance.sort((a, b) => a.distance - b.distance);

        // Filter technicians within 5 km range
        const maxDistanceInMeters = 16;
        const techniciansWithinRange = techniciansWithDistance.filter(technician => technician.distance <= maxDistanceInMeters);

        // Perform sentiment analysis and sort technicians based on sentiment scores
        const sortedTechnicians = techniciansWithinRange.map(technician => {
            // Fetch comments for the technician from the database
            const comments = technician.comments || [];

            // Perform sentiment analysis if comments exist
            if (comments.length > 0) {
                // Perform sentiment analysis on each comment
                const sentiments = comments.map(comment => {
                    try {
                        // Use natural's built-in sentiment analysis
                        // const analyzer = new natural.SentimentAnalyzer();
                        // const score = analyzer.getSentiment(comment);

                        // // Preprocess the comment string to remove line breaks and carriage returns
                        // const sanitizedComment = comment.replace(/[\r\n]/g, '');

                        // Tokenize the sanitized comment into words
                        const tokenizer = new natural.WordTokenizer();
                        const words = tokenizer.tokenize(comment);
                        const score = analyzer.getSentiment(words);

                        return score;
                    } catch (error) {
                        console.error("Error analyzing sentiment for comment:", error);
                        return 0; // Default score in case of error
                    }
                });

                // Calculate the average sentiment score
                const averageSentiment = calculateAverageSentiment(sentiments);
                // console.log(`Average sentiment score for ${technician.name} is ${averageSentiment}`);


                // Attach the average sentiment score to the technician object
                return {
                    // ...technician.toObject(),
                    ...technician,
                    averageSentiment: averageSentiment,

                    ...({ password: undefined }) // Exclude the password field
                };
            } else {
                // No comments, so average sentiment score is 0
                return {
                    // ...technician.toObject(),
                    ...technician,
                    averageSentiment: 0,

                    ...({ password: undefined }) // Exclude the password field
                };
            }
        });

        // Sort technicians based on average sentiment score in descending order
        sortedTechnicians.sort((a, b) => b.averageSentiment - a.averageSentiment);
        console.log('Sorted technicians by sentiment:', sortedTechnicians);



        // Render sentiment_filter.ejs with sorted technicians and technicians within range
        res.render("sentiment_filter", {
            technicians: sortedTechnicians,
            service: service,
            generateInitialsImage: utils.generateInitialsImage
        });
    } catch (error) {
        console.error("Error filtering technicians based on sentiment:", error);
        res.status(500).send("Internal server error");
    }
});






// Define Port for Application
const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});