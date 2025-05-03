var mongoose = require('mongoose');

var jobModel = mongoose.Schema({
   jobname:{
    type: String,
    required:[true,"Job Name se required"]
   },
   jd:{
    type: String,
    required:[true,"jd se required"]
   },
   isActive:{
    type:Boolean,
    default: true
   },
   applicants: [{
    _id: false, 
    userid:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
  userResumeURL:{
    type:String
  }
}]
})

module.exports = mongoose.model('Job',jobModel);