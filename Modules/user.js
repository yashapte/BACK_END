var mongoose = require('mongoose');

var userModel = mongoose.Schema({
        name:{
        type: String,
        required:[true,"Name is required"],
        
    },
    email:{
        type:String,
        required:[true,"Email is required"],      
    },
    password:{
        type:String,
        required:[true,"password is required"]
    },
    
    isAdmin:{
        type: Boolean,
        default: false,
    },
    userResumeURL:{
        type: String
    },
    profileImage: {    
        type: String,  
      },
    jobid:[ {
        type: mongoose.Schema.Types.ObjectId,
      }]
})

module.exports = mongoose.model('User',userModel);