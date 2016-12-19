// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
'use strict';
var dsConfig = require('../datasources.json');
var config = require('../config.json');

module.exports = function(app) {
  var User = app.models.user;

  //verified
  app.get('/auth/verified', function(req, res) {
    var client = config.client;
    res.redirect(client.protocol + '://' + client.host + ':' + client.port + client.loginUrl);
  });

  //log a user in
  app.post('/auth/login', function(req, res) {
    User.login({
      email: req.body.email,
      password: req.body.password,
    }, 'user', function(err, token) {
      if (err) {
        res.json({error: err});
        return;
      }
      res.json({success: true, authorization: token});
    });
  });

  app.get('/auth/session', function(req, res) {
    if (req.accessToken !== null) {
      User.findById(req.accessToken.userId, function(err, user) {
        if (err) {
          res.json({error: err});
          return;
        }
        res.json({success: true, user: user});
        return;
      });
    } else {
      res.json({error: {code: 'TOEKN_NOT_FOUND'}});
    }
  });

  //log a user out
  app.get('/auth/logout', function(req, res) {
    if (req.accessToken !== null) {
      var AccessToken = app.models.AccessToken;
      var token = new AccessToken({id: req.accessToken.id});
      token.destroy();
      res.json({success: true, message: 'token clear'});
    } else {
      res.json({error: {code: 'TOEKN_NOT_FOUND'}});
    }
  });

  //send an email with instructions to reset an existing user's password
  app.post('/request-password-reset', function(req, res, next) {
    User.resetPassword({
      email: req.body.email,
    }, function(err) {
      if (err) return res.status(401).send(err);

      res.render('response', {
        title: 'Password reset requested',
        content: 'Check your email for further instructions',
        redirectTo: '/',
        redirectToLinkText: 'Log in',
      });
    });
  });

  //show password reset form
  app.get('/reset-password', function(req, res, next) {
    if (!req.accessToken) return res.sendStatus(401);
    res.render('password-reset', {
      accessToken: req.accessToken.id,
    });
  });

  //reset the user's pasword
  app.post('/reset-password', function(req, res, next) {
    if (!req.accessToken) return res.sendStatus(401);
    //verify passwords match
    if (!req.body.password ||
        !req.body.confirmation ||
        req.body.password !== req.body.confirmation) {
      return res.sendStatus(400, new Error('Passwords do not match'));
    }

    User.findById(req.accessToken.userId, function(err, user) {
      if (err) return res.sendStatus(404);
      user.updateAttribute('password', req.body.password, function(err, user) {
        if (err) return res.sendStatus(404);
        console.log('> password reset processed successfully');
        res.render('response', {
          title: 'Password reset success',
          content: 'Your password has been reset successfully',
          redirectTo: '/',
          redirectToLinkText: 'Log in',
        });
      });
    });
  });
};
