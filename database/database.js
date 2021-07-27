const Sequelize = require('sequelize');

const sequelize = new Sequelize('crudapp2', 'root', 'open', {dialect: 'mysql', host: 'localhost'});

module.exports = sequelize;