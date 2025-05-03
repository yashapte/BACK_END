var express = require('express');
var router = express.Router();
var User = require('../Modules/user');
var Job = require('../Modules/jobs')
var mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bycrpt = require('bcryptjs');
const authenticateToken = require('../Middleware/auth.js');
var { changepassword } = require('../Modules/changepasswords')
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

/* GET home page. */

mongoose.connect('mongodb://127.0.0.1:27017/porataldb')
  .then(() => console.log("Connected"))
  .catch(() => console.log("Not connected"))


//cloudinary setup
cloudinary.config({
  cloud_name: 'dbj7gjuqq',
  api_key: '397953866216842',
  api_secret: '_81aTlJnGiKTXeEZKZLNfSAtGFI',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'General_Uploads'; 

    if (file.fieldname === 'profileImage') {
      folder = 'User_Profile_Image';
    } else if (file.fieldname === 'userResumeURL') {
      folder = 'User_Resume';
    }

    return {
      folder: folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'], 
      resource_type: 'auto', 
    };
  }
});

const upload = multer({ storage: storage });

router.post('/', function (req, res, next) {
  res.send({ "mesage": "this is / page" })
});


//user register
router.post('/register/user', upload.fields([{ name: 'profileImage', maxCount: 1 },{ name: 'userResumeURL', maxCount: 1 }]),
 async function (req, res) {

  console.log("User register route");

  var { name, email, password } = req.body;

  const profileImageUrl = req.files['profileImage']?.[0];
  const resumeFile = req.files['userResumeURL']?.[0]; 

  const prfimg = profileImageUrl?.path;
  const userRsm = resumeFile?.path;
  const founduser = await User.findOne({ email: req.body.email }).exec();

  if (founduser) {
    return res.json({ "msg": "User already registered with the mail" });
  } else {
    var newuser = new User({
      name,
      email,
      password: changepassword(password),
      profileImage: prfimg,
      userResumeURL: userRsm
    });
    newuser.save();
    res.status(200).json(newuser);
  }
})


//user login
router.post('/user/login', async function (req, res) {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", email, password);

    const foundUser = await User.findOne({ email }).exec();

    if (!foundUser) {
      return res.status(400).json({ msg: "Invalid email, user not found" });
    }

    const isMatched = await bycrpt.compare(password, foundUser.password);

    if (!isMatched) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const token = jwt.sign({ email }, 'webtoken', {
      expiresIn: '1d',
    });

    res.cookie('Token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false
    });

    res.status(200).json({ msg: "Login successful" });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
});



//profile
router.post('/user/profile', authenticateToken, async function (req, res) {
  const loggedinuser = await User.findOne({ email: req.user.email }).exec()
  console.log(loggedinuser);
  return res.status(200).json({ msg: "logged in user", loggedinuser })
})


//logout
router.post('/logout', function (req, res) {
  try {
    res.clearCookie("Token", {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    });
    console.log("user logged out");
    return res.status(200).json({ msg: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Logout failed" });
  }
})


router.post('/user/apply/:jobid', async (req, res) => {

  const { jobid } = req.params;
  const { userId } = req.body;
    console.log(jobid,userId)
  try {
    const currentjob = await Job.findById(jobid);
    if (!currentjob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Fix: Proper check for existing applicant
    const alreadyApplied = currentjob.applicants.some(
      applicant => applicant.userid.toString() === userId
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    const currentuser = await User.findById(userId);
    if (!currentuser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add applicant with resume URL
    currentjob.applicants.push({
      userid: userId,
      userResumeURL: currentuser.userResumeURL || ''
    });
    await currentjob.save();

    currentuser.jobid.push(jobid)
    await currentuser.save();


    return res.status(200).json({ message: 'Application successful', currentjob });
  } catch (err) {
    console.error('Error applying to job:', err.message);
    res.status(500).json({ message: 'Server error' });
  }  
});


router.post('/allusers', function (req, res) {
  User.find()
    .then(function (allusers) {
      res.send(allusers)
    })
    .catch(function (err) {
      res.send(err.message)
    })
})

router.get('/user/allapplied', authenticateToken, async function (req, res) {

  const loggedinuser = await User.findOne({ email: req.user.email }).exec();

  const Alljobs = await Job.find().exec();

  const appliedJobs = Alljobs.filter(job =>
    job.applicants.some(applicant => applicant.userid.toString() === loggedinuser._id.toString())
  );
 

  console.log("This is all applied jobs",appliedJobs)
  return res.status(200).json({ message: 'Application successful', appliedJobs });
})

module.exports = router;
