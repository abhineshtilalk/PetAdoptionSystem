const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Pet = require("../models/pet");
const Comment = require("../models/comment");

const router = Router();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});


const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
  return res.render("addPet", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
  const pet = await Pet.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ petId: req.params.id }).populate("createdBy").populate("petId");

  return res.render("pet", {
    user: req.user,
    pet,
    comments,
  });
});

router.post("/comment/:petId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    petId: req.params.petId,
    createdBy: req.user._id,
  });
  return res.redirect(`/pet/${req.params.petId}`);
});


router.get("/mypets", async (req, res) => {
  tr
      // Fetch pets added by the current user
      // const user = req.user; // Assuming user information is stored in req.user
      // const userPets = await Pet.find({ createdBy: user._id });
      
      return res.render('addPet');

});




router.post("/", upload.single("coverImage"), async (req, res) => {
  const { petName, petType, petAge,petMedicalHis,petAddress,petContactNo,additionalInfo} = req.body;
  const pet = await Pet.create({
    petName,
    petType,
    petAge,
    petMedicalHis,
    petAddress,
    petContactNo,
    additionalInfo,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  return res.redirect(`/pet/${pet._id}`);
});




module.exports = router;
