const User = require('../models/User');
const bcrypt = require('bcryptjs');
const {validationResult} = require('express-validator');
const crypto = require('crypto');
var nodemailer = require('nodemailer');
const { Op } = require("sequelize");

var transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "efe6093ddee654",
    pass: "da2f62699572dd"
  }
});


exports.getLogin = function(req, res, next){
    if (req.session.isLoggedIn === true) {
        return res.redirect('/students');
    } else {
        return res.render('loginpage', {
            title: 'login',
            path: '/login',
            isLoggedIn: false,
            errorMessage: req.flash('error'),
            oldInput: {
                email: '',
                password: '',
            }
        });
    }
}

exports.getSignup = function(req, res, next){
    if (req.session.isLoggedIn === true) {
        res.redirect('/students');
    } else {
        res.render('signup', {
            title: 'signup',
            path: '/signup',
            isLoggedIn: false,
            errorMessage: req.flash('error'),
            oldInput: {
                email: '',
                password: '',
                compfirmPassword: '',
            }
        });   
    }
}

exports.postLogin = function(req, res, next) {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('loginpage', {
            title: 'login',
            path: '/login',
            isLoggedIn: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {email, password},
        }); 
    }
    User.findOne({
        where: {
            email: email,
        }
    })
    .then(user => {
        if(!user){
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }
        bcrypt
            .compare(password, user.password)
            .then(doMatch => {
                if(doMatch){
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    return req.session.save(error => {
                        res.redirect('/students');
                    });
                }
                res.redirect('/login');
            })
            .catch(error => {
                res.redirect('/login');
            });

    })
    .catch(error => {
        console.log(error);
    });
}

exports.postSignup = function(req, res, next) {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confimPassword = req.body.confimPassword;

    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('signup', {
            title: 'signup',
            path: '/signup',
            isLoggedIn: false,
            errorMessage: errors.array()[0].msg + ' ' + errors.array()[0].param,
            oldInput: {name, email, password},
        }); 
    }
    User.findOne({ 
            where: {
                email: req.body.email,
            }
        })
        .then(user => {
            if(user !== null){
                req.flash('error', 'User or email address already exist.');
                res.redirect('/signup');
            }else{
                return bcrypt.hash(password, 12)
                                .then(hashedPassword => {
                                    const user = new User({
                                            name: name,
                                            email: email,
                                            password: hashedPassword,
                                        });
                                        return user.save();
                                }).then(result => {
                                    res.redirect('/login');
                                }).catch(error => {
                                    console.log(error);
                                });
            }
        }).catch(error => {
            console.log(error);
        });
}

exports.logout = function(req, res, next){
    // console.log('logout');
    req.session.destroy(error => {
        if (error) {
            console.log(error);
            res.send('Error in logout');
        }else{
            res.redirect('/');
        }
    });
}

exports.getReset = function(req, res, next){
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('reset', {
        path: '/reset',
        title: 'Reset Password',
        isLoggedIn: false,
        errorMessage: message,       
    });
}

exports.postReset = function(req, res, next){
    crypto.randomBytes(32, (error, buffer) => {
        if (error) {
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
                .then(user => {
                    if (!user) {
                        req.flash('error', 'No account with that email found.');
                        return res.redirect('/reset');
                    }
                    user.resetToken = token;
                    user.resetTokenExpiration = Date.now() + 3600000;
                    return user.save();
                }).then(result => {
                    res.redirect('/');
                    // send email here
                    let mailOptions = {
                        from: req.body.email,
                        to: 'bhbobl@logicstreak.com',
                        subject: 'Password reset',
                        html: `
                            <p>You requested a password reset</p>
                            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset new password.</p>
                        `
                    };

                    transport.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message sent: %s', info.messageId);
                    });

                }).catch(error => {
                    console.log(error);
                });
    });
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    
    User.findOne({ 
            where: {
                resetToken: token,
                resetTokenExpiration: {
                    [Op.gte]: Date.now(),
                }
            }
        })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }

            res.render('new-password', {
                path: '/new-password',
                title: 'Reset Password',
                isLoggedIn: false,
                errorMessage: message,
                userId: user.id,   
                passwordToken: token,    
            });    
        })
        .catch(error => {
            console.log(error);
        });
}

exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const newPassword = req.body.password;
    const passwordToken = req.body.passwordToken;  
    let resetUser;  
    User.findOne({ 
            where: {
                id: userId,
                resetToken: passwordToken,
                resetTokenExpiration: {
                    [Op.gte]: Date.now(),
                }
            }
        })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = null;
            resetUser.resetTokenExpiration = null;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(error => {
            console.log(error);
        });
}