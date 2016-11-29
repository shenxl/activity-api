'use strict';
var objectAssign = require('object-assign');
var _ = require('lodash');


module.exports = function(companyMonthly) {
  companyMonthly.remoteMethod('destroyAll', {
    isStatic: true,
    description: 'Delete all matching records',
    accessType: 'WRITE',
    accepts: {arg: 'where', type: 'object', description: 'filter.where object'},
    http: {verb: 'del', path: '/'},
    returns: {
        arg: 'success', type: 'object', root: true
    },
  });
};
