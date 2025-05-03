var express = require('express');
var router = express.Router();
var Job = require('../Modules/jobs')
var User = require('../Modules/user')
const jwt = require('jsonwebtoken');
const authenticateToken = require('../Middleware/auth.js');
var { changepassword } = require('../Modules/changepasswords')
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


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

router.post('/register/rc', upload.fields([{ name: 'profileImage', maxCount: 1 },{ name: 'userResumeURL', maxCount: 1 }]),
async function (req, res) {
try {
  

  console.log("Admin register route");
  
  var { name, email, password } = req.body;


  const profileImageUrl = req.files['profileImage']?.[0];
  const resumeFile = req.files['userResumeURL']?.[0]; 

  const prfimg = profileImageUrl?.path;
  const userRsm = resumeFile?.path;


  const founduser = await User.findOne({ email: req.body.email }).exec();

  if (founduser) {
    res.json({ "msg": "Admin already registered with the mail" });
  } else {
    var newuser = new User({

      isAdmin : true,
      name,
      email,
      password: changepassword(password),
      profileImage: prfimg,
      userResumeURL: userRsm
    });
    newuser.save();
    res.status(200).json(newuser);
  }
} catch (error) {
  console.log(error.message)
}

})

router.post('/login/rc',async function (req, res) {
  try {

    const { email, password } = req.body
    console.log("Login attempt:", email, password)
    const founduser = await User.findOne({ email: req.body.email }).exec();
    console.log("first", founduser)
    if (!founduser) {
      return res.json({ "msg": "Invalid email user not found" })
    }

    if (!founduser.isAdmin) {
      return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }
    const ismatched = await bcrypt.compare(password, founduser.password)
    if (!ismatched) {
      return res.status(400).json({ msg: "Invalid email user not found" });
    } else {

      const token = jwt.sign({email}, 'webtoken', { expiresIn: "1d" })
      res.cookie('Token', token, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: false
      })
      console.log("this is login router")
      res.status(200).json({ msg: "Login successful" });
    }
  } catch (error) {
    return res.json(error.msg)
    return res.status(500).json({ msg: "Internal server error" });
  }
})

router.post('/profile/rc', authenticateToken, async function (req, res) {
  const loggedinuser = await User.findOne({email: req.user.email}).exec()
  console.log(loggedinuser);
  return res.status(200).json({ msg: "logged in user", loggedinuser })
})



router.get('/alljobs', async function (req, res) {
  let reversedarray;
  const jobs = await Job.find()
    .populate('applicants.userid', 'name email userResumeURL')
    .exec();

    console.log("This is after populate",jobs)
    reversedarray= jobs.reverse();
  console.log("Populated jobs:", JSON.stringify(jobs, null, 2)); 
  res.json({ alljobs: reversedarray });

})

router.post('/createjob', async function (req, res) {
  try {
    const { jobname, jd } = req.body;

    if (!jobname || !jd) {
      return res.status(400).json({ msg: 'Job name and description are required' });
    }

    const newJob = new Job({
      jobname,
      jd,
    });

    await newJob.save();

    return res.status(201).json({ msg: 'Job created successfully', job: newJob });
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ msg: 'Server error' });
  }
})


router.put('/updatejob/:id', async function (req, res){
  const { id } = req.params;
  const { jobname, jd } = req.body;

  try {
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { jobname: jobname, jd },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

   return res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating job' });
  }
});

// router.post('/allapplicants/rc', async function (req, res) {

//   const jobs = await Job.find().populate('applicants', 'name email').exec();
//   res.json({ alljobs: jobs });
//   const allApplicants = jobs.map(job => job.applicants.map(applicant => applicant.toString()));
//   const flatApplicants = [].concat(...allApplicants);
//   console.log('Applicant IDs:', flatApplicants);
//   res.json({ applicantIds: flatApplicants });
//   const applicantdetails = flatApplicants.map(async (items)=>{
//     const a = await User.findById(items).exec();
//     console.log("Found ",a.name)
//   })

// })

router.delete('/job/delete/:id', authenticateToken, async (req, res) => {
  try {
    const jobId = req.params.id;

    const deletedJob = await Job.findByIdAndDelete(jobId);

    if (!deletedJob) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    res.json({ msg: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;