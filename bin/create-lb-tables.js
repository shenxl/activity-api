var server = require('../server/server');
var ds = server.dataSources.activityDB;
var lbTables = ['user', 'AccessToken', 'ACL', 'RoleMapping', 'Role','team'];

ds.isActual(lbTables, function(err, actual) {
if (!actual) {
  ds.autoupdate(lbTables, function(er) {
    if (er) throw er;
    console.log('Loopback tables [' - lbTables - '] created in ', ds.adapter.name);
    ds.disconnect();
  });
}
});
