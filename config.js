'use strict';

module.exports = {
  PORT: process.env.PORT || 8080
};

exports.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/noteful';