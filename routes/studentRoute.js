const express = require('express');
const {check, body} = require('express-validator');

const router = express.Router();

const StudentController = require('../controllers/StudentController');
const authController = require('../controllers/authController');

const isAuth = require('../middleware/is-auth');

router.get('/', StudentController.index);
router.get('/students', isAuth, StudentController.students);
router.get('/create-student', isAuth, StudentController.create);
router.post('/add-student', 
        [
            body('name')
                .not()
                .isEmpty().withMessage('Invalid name value'),
            body('email')
                .not()
                .isEmpty()
                .isEmail().withMessage('Invalid email'),
            body('phone')
                .not()
                .isEmpty().withMessage('Invalid phone value'),
        ], isAuth, StudentController.store);

router.get('/edit/:id', isAuth, StudentController.edit);

router.post('/update', 
        [
            body('name').not().isEmpty().withMessage('Please enter name.'),
            body('email', 'Your email is not valid.').not().isEmpty(),
        ], isAuth, StudentController.update);

router.post('/delete', isAuth, StudentController.delete);

// authentication
router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/postsignedup', 
        [
            body('email')
                .isEmail()
                .withMessage('Please enter a valid email.'),
            body('password')
                .trim()
                .notEmpty().withMessage('Password required')
                .isLength({ min: 4 }).withMessage('password must be minimum 5 length'),
            body('confirmPassword')
                .custom(function(value, { req }){
                    if(value !== req.body.password){
                        throw new Error('Password have to match!');
                    }
                    return true;
                }),
    ], authController.postSignup);

router.post('/postloggedin', 
        [
            check('email')
                .isEmail()
                .withMessage('Please enter a valid email.'),
            body('password', 'Please enter a password with only numbers and text and at least  4 characters.')
                .isLength({min: 4})
                .isAlphanumeric(),
    ], authController.postLogin);

router.get('/logout', authController.logout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
