let passport = require('passport');
let localStrategy = require('./auth-strategy/LocalStrategy');
let facebookStrategy = require('./auth-strategy/FacebookStrategy');
//let config = require('config');

module.exports = function(app) {
  let log = require('logfilename')(__filename);

  let models = app.data.sequelize.models;

  localStrategy(passport, models);
  facebookStrategy(passport, models);

  passport.serializeUser(function(user, done) {
    log.debug("serializeUser ", user);
    //TODO use redis
    done(null, user);
  });

  passport.deserializeUser(function(id, done) {
    log.debug("deserializeUser ", id);
    //TODO use redis
    done(null, id);
  });

  function ensureAuthenticated(req, res, next) {
    log.info("ensureAuthenticated ", req.url);
    if (!req.isAuthenticated()) {
      log.info("ensureAuthenticated KO: ", req.url);
      return res.status(401).send("Unauthorized");
    }

    return next();
  }

  function isAuthorized(req, res, next) {
    if (!req.user) {
      return next({error:"UserNotSet"});
    }
    let routePath = req.route.path;
    let userId = req.user.id;
    log.info("isAuthorized: who:%s, resource:%s, method %s", userId, routePath, req.method);

    models.User.checkUserPermission(userId, routePath, req.method)
    .then(function(authorized) {
      log.info("isAuthorized ", authorized);
      if (authorized) {
        next();
      } else {
        res.status(401).send();
      }
    });
  }

  return {
    ensureAuthenticated:ensureAuthenticated,
    isAuthorized:isAuthorized
  };
};