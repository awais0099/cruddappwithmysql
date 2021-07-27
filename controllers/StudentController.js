const Student = require('../models/Student');
const {validationResult} = require('express-validator/check');

exports.index = function(req, res){
    if (!req.session.isLoggedIn) {
        return  res.render('index', {
                    title: 'index',
                    path: '/',
                    isLoggedIn: false,
                });
    }
    res.render('index', {
        title: 'index',
        path: '/',
        isLoggedIn: true,
    });
}

exports.students = function(req, res, next){
    console.log(req.flash('success'));
    if (req.session.isLoggedIn === true) {
        Student.findAll()
            .then(students => {
                res.render('students', {
                    title: 'students',
                    path: '/students',
                    students: students,
                    isLoggedIn: true,  
                });
            })
            .catch(error => {
                // console.log(error);
            });   
    } else {
        res.redirect('/login');
    }
}

exports.create = function (req, res) {
    if (req.session.isLoggedIn === true) {
        return res.render('create', {
            title: 'add student',
            path: '/create-student',
            isLoggedIn: true,
            errorMessage: '',
            oldInput: {
                name: '', 
                email: '', 
                phone: ''
            },
        });
    } else {
        req.flash('error', 'Please login');
        return res.redirect('/login');
    }
}

exports.store = function (req, res) {
    if (req.session.isLoggedIn === true) {
        console.log(req.body)
        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors.array());
            return res.status(422).render('create', {
                title: 'add student',
                path: '/create-student',
                isLoggedIn: false,
                errorMessage: errors.array(),
                oldInput: {name, email, phone},
            });
        }
        Student.create({
            name: name,
            email: email,
            phone: phone,
        }).then(result => {
            console.log(result);
            return res.redirect('/create-student');
        }).catch(error => {
            console.log(error);
        });
    } else {
        return res.redirect('/login');
    }
    
}

exports.edit = function (req, res) {
    if (req.session.isLoggedIn === true) {
        Student.findByPk(req.params.id)
        .then(student => {
            res.render('edit', {
                path: '/edit',
                title: 'edit',
                student: student,
                isLoggedIn: true,
                errorMessage: ''
            });
        }).catch(error => {
            res.send(error);
        });
    } else {
        res.redirect('/login');
    }   
}

exports.update = function(req, res, next){
    const updatedName = req.body.name;
    const updatedEmail = req.body.email;
    const updatedPhone = req.body.phone;

    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(422).render('edit', {
                path: '/edit',
                title: 'edit',
                student: {name: updatedName, email: updatedEmail, phone: updatedPhone},
                isLoggedIn: true,
                errorMessage: errors.array(),
            });
    }
    Student.findByPk(req.body.studentId)
            .then(function(student){
                student.name = req.body.name;
                student.email = req.body.email;
                student.phone = req.body.phone;
                return student.save();
            })
            .then(function(result){
                req.flash('success', 'Student updated successfully.');
                res.redirect('/students');
            })
            .catch(function(error){
                // console.log(error);
            });
}

exports.delete = function(req, res){
    if (req.session.isLoggedIn === true) {
        Student.findByPk(req.body.studentId)
            .then(student => {
                return student.destroy();
            })
            .then(result => {
                req.flash('success', 'Student updated successfully.');
                res.redirect('/students');
            })
            .catch(error => {
                console.log(error);
            });   
    } else {
        res.redirect('/login');
    }
}