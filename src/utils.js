// const fs = require('fs');
// const path = require('path');
// const { createCanvas } = require('canvas');

// // Function to generate initials image
// function generateInitialsImage(firstName, lastName) {
//     // Get the first letter of the first and last name
//     const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

//     // Create a canvas element
//     const canvas = createCanvas(200, 200);
//     const context = canvas.getContext('2d');

//     // Draw a circle with the initials inside
//     context.beginPath();
//     context.arc(100, 100, 90, 0, 2 * Math.PI);
//     context.fillStyle = '#ccc'; // Background color for the circle
//     context.fill();
//     context.fillStyle = '#fff'; // Text color for the initials
//     context.font = '80px Arial'; // Font size and family
//     context.textAlign = 'center';
//     context.textBaseline = 'middle';
//     context.fillText(initials, 100, 100);

//     // Define the directory where the images will be saved
//     const imagesDir = path.join(__dirname, 'images');

//     // Ensure the directory exists, if not, create it
//     if (!fs.existsSync(imagesDir)) {
//         fs.mkdirSync(imagesDir, { recursive: true });
//     }

//     // Generate a unique filename
//     const filename = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}.png`;
//     const imagePath = path.join(imagesDir, filename);

//     // Convert the canvas to a PNG image file
//     const out = fs.createWriteStream(imagePath);
//     const stream = canvas.createPNGStream();
//     stream.pipe(out);
//     out.on('finish', () => {
//         console.log('Image saved:', filename);
//     });

//     // Return the URL of the saved image
//     return `/images/${filename}`; // Assuming the images are served from the '/images' directory
// }

// // Export the function to be accessible from other files
// module.exports = { generateInitialsImage };



// const { createCanvas, loadImage } = require('canvas');

// // Function to generate initials image
//  function generateInitialsImage(firstName, lastName) {
//     // Get the first letter of the first and last name
//     const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

//     // Create a canvas element
//     const canvas = createCanvas(200, 200);
//     const context = canvas.getContext('2d');

   
//     context.beginPath();
//     context.arc(100, 100, 90, 0, 2 * Math.PI);
//     context.fillStyle = '#000'; // Background color for the circle
//     context.fill();

//     context.fillStyle = '#fff'; // Text color for the initials
//     context.font = '80px Arial'; // Font size and family
//     context.textAlign = 'center';
//     context.textBaseline = 'middle';
//     context.fillText(initials, 100, 100);

//     // Convert the canvas to a data URL
//     const dataURL = canvas.toDataURL('image/png');

//     // Return the data URL
//     return dataURL;
// }

// // Export the function to be accessible from other files
// module.exports = { generateInitialsImage };

const { createCanvas } = require('canvas');

// Function to generate initials image
function generateInitialsImage(firstName, lastName) {
    // Get the first letter of the first and last name
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

    // Create a canvas element
    const canvas = createCanvas(400, 400);
    const context = canvas.getContext('2d');

    // Draw a circle with the background color
    context.beginPath();
    context.arc(200, 200, 180, 0, 2 * Math.PI); // Centered circle
    context.fillStyle = '#1f0f0f'; // Brownish background color
    context.fill();

    // Draw the initials with white color
    context.fillStyle = '#ffffff'; // White text color
    context.font = 'bold 120px Ubuntu'; // Font size and family
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(initials, 200, 200);

    // Convert the canvas to a data URL
    const dataURL = canvas.toDataURL('image/png', 1.0); // Quality set to 100%

    // Return the data URL
    return dataURL;
}

// Export the function to be accessible from other files
module.exports = { generateInitialsImage };

