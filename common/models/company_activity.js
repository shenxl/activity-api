'use strict';
var objectAssign = require('object-assign');
var _ = require('lodash');
const catalogType = {
  GOVERNMENT: ['政府', '政府行业', '部委'],
  ENTERPRISE: ['企业', '地方国企', '央企', '港澳台企业'],
  FINANCE: ['金融'],
  NORMALIZATION: ['常态化'],
};

module.exports = function(CompanyAtivity) {
  CompanyAtivity.afterRemote('findOne', function(context, company, next) {
  });

  CompanyAtivity.beforeRemote('findOne', function(context, company, next) {
  });

  CompanyAtivity.catalog = function(ctx, type, options, cb) {
    let typefilter = {};
    let optwhere = {};
    let filter = {};

    if (!type) typefilter = {where: {type: {inq: catalogType['GOVERNMENT']}}};
    else {
      const catalog = catalogType[type.toLocaleUpperCase()];
      typefilter = {where: {type: {inq: catalog}}};
    }

    if (options && options.where) {
      let andopt = [];
      andopt.push(options.where);
      andopt.push(typefilter.where);
      optwhere = {where: {and: andopt}};
    } else {
      optwhere = objectAssign({}, options, typefilter);
    }

    filter = objectAssign({}, options, optwhere);

    CompanyAtivity.count(optwhere.where, function(err, count) {
      if (err) {
        cb(err);
      } else {
        CompanyAtivity.find(filter, function(err, companies) {
          if (err) {
            cb(err);
          } else {
            ctx.res.statusCode = 201;
            ctx.res.json({
              success: true,
              data: companies,
              page: {
                total: count,
                current: options && (options.skip || 0),
              },
            });
          }
        });
      }
    });
  };

  CompanyAtivity.remoteMethod(
      'catalog',
    {
      description: ['企业根据大分类返回数据 , 其中:',
                    'GOVERNMENT: 获得政府数据',
                    'ENTERPRISE: 获得企业数据',
                    'FINANCE: 获得金融数据',
                    'NORMALIZATION: 获得常态化数据.'],
      accepts: [
              {arg: 'ctx', type: 'object', http: {source: 'context'}},
              {arg: 'type', type: 'string', http: {source: 'query'}},
              {arg: 'options', type: 'object', http: {source: 'query'}},
      ],
      returns: {
        arg: 'companies', type: 'object', root: true,
      },
      http: {verb: 'get'},
    }
  );
};
