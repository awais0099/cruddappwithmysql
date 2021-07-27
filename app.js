const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sequelize = require('./database/database');
const session = require('express-session');
const csrf = require('csurf');
const flash = require('connect-flash');

// Import the user model we have defined
const Student = require('./models/Student');
const User = require('./models/User');

const app = express();
// initalize sequelize with session store
const SequelizeStore = require("connect-session-sequelize")(session.Store);

const csrfProtection = csrf();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ 
        secret: 'my secret', 
        resave: false, 
        saveUninitialized: false,
        store: new SequelizeStore({
            db: sequelize,
        }),
    }));

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next(); 
});

app.use((req, res, next) => {
    res.locals.successMessage = req.flash('success');
    next(); 
});

// Load student routes
const studentRoute = require('./routes/studentRoute');
app.use(studentRoute);

sequelize
    .sync()
    .then(result => { 
        // console.log(result); 
        app.listen(3000);
    })
    .catch(error => { console.log(error); });

