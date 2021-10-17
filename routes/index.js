const express = require('express');

const router = express.Router();

const bcrypt = require('bcrypt');

const passport = require('passport');

const {ensureAuthenticated} = require('../config/auth');

//User model 
const User = require('../models/user')

//Login Page
router.get('/', (req, res) => {
  res.render('login');
});

//Dashboard page
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', {
    name: req.user.name
  });
});

//Register Handle
router.post('/register', (req, res) => {
  const {name, email, password, passwordConfirm} = req.body
  let errors = [];

  //Check required fields
  if (!name || !email || !password || !passwordConfirm) {
    errors.push({msg: 'Please fill in all fields'})
  }

  //Check password match
  if(password !== passwordConfirm){
    errors.push({msg: 'Passwords do not match'})
  }

  //Check pass length
  if(password.length < 6){
    errors.push({msg: 'Password should be at least 6 characters'})
  }

  if (errors.length > 0) {
    res.render('login', {
      errors,
      name,
      email,
      password,
      passwordConfirm
    })
  } else {
      //Validation passed
      User.findOne({ email: email })
        .then(user => {
          if(user){
            errors.push({msg: 'Email is already registered'})
            //User exists
            res.render('login', {
              errors,
              name,
              email,
              password,
              passwordConfirm
            });
          } else {
            const newUser = new User({ 
              name,
              email,
              password
            })
            
            //Hash Password
            bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
              if(err) throw err;
              //Set password to hashed
              newUser.password = hash;
              // Save user
              newUser.save()
                .then(user => {
                  req.flash('success_msg', 'You are now registered and can log in')
                  res.redirect('/');
                })
                .catch(err => console.log(err));
            }))
            
          }
        });;
  }

});

//Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/',
    failureFlash: true
  }) (req, res, next);
});

//Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect("/");
})

module.exports = router;