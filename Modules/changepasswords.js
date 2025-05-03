var bycrpt = require("bcryptjs");

exports.changepassword = (password) =>{
    return bycrpt.hashSync(password, 10);
}