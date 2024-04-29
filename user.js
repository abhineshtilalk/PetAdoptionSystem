const Pet = require("../models/pet")
const Donation = require("../models/donation");
const Feedback = require("../models/feedback");

const Router  = require("express");
const Fuse = require('fuse.js');
const router = Router();

const { User } = require("../models/user");



router.get("/signin", (req, res) => {
  return res.render("signin");
});
router.get("/signup", (req, res) => {
  return res.render("signup");
});
router.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/");
});
router.get("/donate", (req, res) => {
  // Render donate.ejs page
  return res.render('donate', {user : req.user});
});
router.get("/feedback", (req, res) => {
  return res.render('feedback', {user : req.user});
});
router.get("/search", async (req, res) => {
  try {
    const searchQuery = req.query.query; // Extract the search query from the URL
    const allPets = await Pet.find(); // Perform a database query to find all pets
    const options = {
      includeScore: true,
      keys: ['petType'] // Specify which keys to search within , // Define options for the fuzzy search
    };
     const fuse = new Fuse(allPets, options); // Initialize a new Fuse instance with the options
     const result = fuse.search(searchQuery); // Perform the fuzzy search
     const pets = result.map(item => item.item); 
    return res.render("searchResults", { pet: pets, user: req.user });  // Render a page displaying the matching pets
  } catch (error) {
    console.error("Error searching for pets:", error);
    return res.status(500).send("Internal Server Error");
  }
});


router.post("/signin", async (req, res) => {
  const { email, password } = await req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);

    return res.cookie("token", token).redirect("/");
  } catch (error) {
    return res.render("signin", {
      error: "Incorrect Email or Password",
    });
  }
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    await User.create({
      fullName,
      email,
      password,
    });
    return res.redirect("/");
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).send("Internal Server Error");
  }
});


router.get('/mypets', async (req, res) => {
  try {
      // Fetch pets added by the current user
      const user = req.user; // Assuming user information is stored in req.user
      const userPets = await Pet.find({ createdBy: user._id });
      
     return res.render('mypets', { userPets : userPets, user : req.user});
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});

router.post('/:petId/updateAdoptionStatus', async (req, res) => {
  const petId = req.params.petId;
  const newStatus = req.body.adoptionStatus;
  try {
      // Find the pet by ID and update its adoption status
      await Pet.findByIdAndUpdate(petId, { adoptionStatus: newStatus });
      res.redirect('/user/mypets'); // Redirect to mypets page after update
  } catch (error) {
      console.error('Error updating adoption status:', error);
      res.status(500).send('Error updating adoption status');
  }
});
router.post('/:petId/delete', async (req, res) => {
  const petId = req.params.petId;
  try {
      // Find the pet by ID and delete it
      await Pet.findByIdAndDelete(petId);
      res.redirect('/user/mypets'); // Redirect to mypets page after deletion
  } catch (error) {
      console.error('Error deleting pet:', error);
      res.status(500).send('Error deleting pet');
  }
});
router.post("/donate", async (req, res) => {
  try {
      const { name, address, age, gender, amount, email, contactNo } = req.body;
      const newDonation = new Donation({
          name,
          address,
          age,
          gender,
          email,
          contactNo,
          amount,   
      });
      await newDonation.save();
       res.send(`Thank you for your donation! Our team will contact you within 24 hours. <a href="/">Return to homepage</a>`);
  } catch (error) {
      console.error("Error processing donation:", error);
      res.status(500).send("Internal Server Error");
  }
});
router.post("/feedback", async (req, res) => {
  try {
      const { name, email, message } = req.body;
      const feedback = new Feedback({
          name,
          email,
          message
      });
      await feedback.save();
      res.send(`Thank you for your feedback! We are constantly striving to be better. <a href="/">Return to homepage</a>`);
  } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
