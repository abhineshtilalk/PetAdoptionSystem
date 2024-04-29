const Pet = require("../models/pet")
const Donation = require("../models/donation");
const Feedback = require("../models/feedback");
const { User } = require("../models/user");
const { Router } = require("express");
const Fuse = require('fuse.js');
const { render } = require("ejs");
const router = Router();
const Comment = require("../models/comment");

router.get("/dashboard", async (req,res) => 
{
    try {
    // Fetch total counts from database
    const totalPets = await Pet.countDocuments();
    const totalUsers = await User.countDocuments();
    const donations = await Donation.find();
    const latestPets = await Pet.find().sort({ createdAt: -1 }).limit(5);

    let totalDonations = 0;
    donations.forEach(donation => {
        totalDonations += donation.amount;
    });

    // Render dashboard template with counts
    res.render('adminDashboard', { totalPets, totalUsers, totalDonations, latestPets });
} catch (err) {
    console.error('Error fetching counts:', err);
    res.status(500).send('Internal Server Error');
}
})

router.get("/pets", async (req, res) => {
    try {
        // Fetch all pets from the database
       
        const pets = await Pet.find().populate('createdBy');
        // Render the pet management page with the fetched pets
        res.render('petManagement', {pets, index: 0});
    } catch (err) {
        console.error('Error fetching pets:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/pet/:id/delete', async (req, res) => {
    const petId = req.params.id;

    try {
        // Find the pet by ID and delete it
        await Pet.findByIdAndDelete(petId);
        res.redirect('/admin/pets');
    } catch (error) {
        console.error('Error deleting pet:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/pet/:id/update', async (req, res) => {
    const petId = req.params.id;

    try {
        // Find the pet by ID
        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).send('Pet not found');
        }

        // Render the update form with the pet data
        res.render('updatePet', { pet });
    } catch (error) {
        console.error('Error finding pet for update:', error);
        res.status(500).send('Internal Server Error');
    }
});

// POST route for updating a specific pet
router.post('/pet/:id/update', async (req, res) => {
    const petId = req.params.id;
    const updatedPetData = req.body;

    try {
        // Find the pet by ID and update it with the new data
        await Pet.findByIdAndUpdate(petId, updatedPetData);
        res.redirect('/admin/pets');
    } catch (error) {
        console.error('Error updating pet:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/pets/search", async (req, res) => {
    try {
        const searchQuery = req.query.search;
        const pets = await Pet.find().populate('createdBy');

        // Define options for fuzzy search
        const options = {
            keys: ['petName', 'petType', 'petAddress',], // Properties to search in
            includeScore: true,
            threshold: 0.4, // Adjust threshold as needed
            ignoreLocation: true,
            distance: 100,
            minMatchCharLength: 1,
        };

        // Create Fuse instance with pets data and search options
        const fuse = new Fuse(pets, options);

        // Perform fuzzy search
        const searchResults = fuse.search(searchQuery);

        // Extract search results
        const filteredPets = searchResults.map(result => result.item);

        res.render('petManagement', { pets: filteredPets, index: 0 });
    } catch (err) {
        console.error('Error searching pets:', err);
        res.status(500).send('Internal Server Error');
    }
});


// Route to render the user management page
router.get('/users', async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find();
        
        // Fetch activity logs
        res.render('userManagement', { users, });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/user/:id/view", async (req, res) => {
    try {
        // Fetch user details by ID
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Fetch pets associated with the user
        const pets = await Pet.find({ createdBy: userId });

        // Render the viewUser page with user and associated pets data
        res.render('viewUser', { user, pets });
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).send('Internal Server Error');
    }
});
// Route for searching users
router.get('/users/search', async (req, res) => {
    try {
        const searchQuery = req.query.search;
        const users = await User.find();

        // Define options for fuzzy search
        const options = {
            keys: ['fullName', 'email', 'role', 'address'], // Properties to search in
            includeScore: true,
            threshold: 0.4, // Adjust threshold as needed
            ignoreLocation: true,
            distance: 100,
            minMatchCharLength: 1,
        };

        // Create Fuse instance with users data and search options
        const fuse = new Fuse(users, options);

        // Perform fuzzy search
        const searchResults = fuse.search(searchQuery);

        // Extract search results
        const filteredUsers = searchResults.map(result => result.item);

        res.render('userManagement', { users: filteredUsers });
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render the update user page
router.get('/user/:id/update', async (req, res) => {
    const userId = req.params.id;

    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Render the update form with the user data
        res.render('updateUser', { user });
    } catch (error) {
        console.error('Error finding user for update:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle updating user information
router.post('/user/:id/update', async (req, res) => {
    const userId = req.params.id;
    const updatedUserData = req.body;

    try {
        // Find the user by ID and update it with the new data
        await User.findByIdAndUpdate(userId, updatedUserData);
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to delete a user
router.post('/user/:id/delete', async (req, res) => {
    const userId = req.params.id;

    try {
        // Find the user by ID and delete it
        await User.findByIdAndDelete(userId);
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/:petId/comment/:commentId/delete', async (req, res) => {
    const { petId, commentId } = req.params;

    try {
        // Find the comment by ID
        const comment = await Comment.findById(commentId);

        // Check if the comment exists
        if (!comment) {
            return res.status(404).send('Comment not found');
        }

        // Check if the comment belongs to the specified pet
        if (comment.petId.toString() !== petId) { // Corrected field name
            return res.status(403).send('Unauthorized');
        }

        // Delete the comment
        await comment.remove();

        // Redirect back to the pet details page
        res.redirect(`/pet/${petId}`);
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/donations', async (req, res) => {
    try {
        // Fetch all donations from the database
        const donations = await Donation.find();

        // Render the donation management page with the fetched donations
        res.render('donation', { donations });
    } catch (err) {
        console.error('Error fetching donations:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/donation/:id/update', async (req, res) => {
    const donationId = req.params.id;
    
    try {
        // Find the donation by ID
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).send('Donation not found');
        }

        // Render the update form with the donation data
        res.render('updateDonation', { donation });
    } catch (error) {
        console.error('Error finding donation for update:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/donation/:id/update', async (req, res) => {
    const donationId = req.params.id;
    const updatedDonationData = req.body;

    try {
        // Find the donation by ID and update it with the new data
        await Donation.findByIdAndUpdate(donationId, updatedDonationData);
        res.redirect('/admin/donations');
    } catch (error) {
        console.error('Error updating donation:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Delete Donation Route
router.post('/donation/:id/delete', async (req, res) => {
    const donationId = req.params.id;

    try {
        // Find the donation by ID and delete it
        await Donation.findByIdAndDelete(donationId);
        res.redirect('/admin/donations');
    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Route to handle donation search
router.get('/donations/search', async (req, res) => {
    try {
        // Extract the search query from the request parameters
        const searchQuery = req.query.search;

        // Handle empty search query
        if (!searchQuery) {
            return res.status(400).send('Please provide a search query');
        }

        // Search donations based on name, amount, and email
        const donations = await Donation.find({
            $or: [
                { name: { $regex: new RegExp(searchQuery, 'i') } }, // Case-insensitive name search
                { email: { $regex: new RegExp(searchQuery, 'i') } }, // Case-insensitive email search
                // Parse searchQuery as a number for amount field
                { amount: !isNaN(searchQuery) ? parseFloat(searchQuery) : null },
            ].filter(condition => condition !== null) // Filter out null conditions
        });

        res.render('donation', { donations });
    } catch (err) {
        console.error('Error searching donations:', err);
        res.status(500).send('Internal Server Error');
    }
});



module.exports = router;