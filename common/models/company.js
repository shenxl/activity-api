'use strict';
var objectAssign = require('object-assign');
var _ = require('lodash');

// 根据筛选条件求和 （针对 model monthly 的 activity_sum , activity_avg 与 install_sum 属性）

var countSumForMonthly = function(monthly,fiterFunc) {
  return _.chain(monthly)
    .filter(fiterFunc || function(){ return true })
    .reduce(function(result, item) {
      return {
        sum: result.sum + item.activity_sum,
        avg: result.avg + item.activity_avg,
        install: result.install + item.install_sum,
      }
    }, {
      sum: 0,
      avg: 0,
      install: 0
    })
};

var getRecordByCompany = function(company, options) {
  return _.chain(company).
    map(function(o) {
      const companyObj = o.toJSON();
      const order = companyObj.order;
      const monthly = companyObj.companyMonthly;
      return {
        id: o.id,
        name: o.name,
        region: o.region,
        province: o.province,
        city: o.city,
        county: o.county,
        type: o.type,
        industry: o.industry,
        order: order,
        important: o.important,
        activeDetails: monthly,
        buy: _.sumBy(order, function(orderItem) {
          return _.parseInt((orderItem.order_number) || 0) +
            _.parseInt((orderItem.after_authorization) || 0) +
            _.parseInt((orderItem.prediction) || 0)
        }),
        active: countSumForMonthly(monthly,function(item){ return _.eq(item.year, options.year) && _.eq(item.month, options.month) }).value()
      }
    }).
    orderBy(options.field, options.seq)
}

var groupByMonthly = function(list, field, mapfunc){
  return _.chain(list).groupBy(field).map(mapfunc).value();
}

var getReportByMonthly = function(monthly) {
  return _.chain(monthly).
  groupBy('server_id').
  map(function(server, key) {
    return {
      server_id: key,
      item: _.chain(server).groupBy('year').map(function(year, key) {
        return {
          year: key,
          item: _.chain(year).groupBy('month').map(function(monthly, key) {
            return {
              month: key,
              recode: countSumForMonthly(monthly).value()
            }
          }).value()
        };
      })
    }
  })
}

module.exports = function(Company) {
  var nowdate =  _.now();

  Company.afterRemote('find', function(context, company, next) {
    next();
  });

  Company.beforeRemote('find', function(context, company, next) {
    next();
  });

  Company.getRecord = function (context,filter,limit,skip,year,month,field,seq,cb){
    nowdate =  _.now();
    Company.find(filter,function(err,company){
      if(err){
        cb(err)
      }
      nowdate =  _.now();
      const options = {
         month : _.toInteger(month) || new Date().getMonth() + 1,
         year : _.toInteger(year) || new Date().getFullYear(),
         skip : _.toInteger(skip) || 0,
         limit : _.toInteger(limit) || 10,
         field : field || 'buy',
         seq : seq || 'desc'
      }

      const company_record = getRecordByCompany(company,options).value();

      // 获得符合条件的 全部 monthly 数据
      const companyMonthly = _.reduce(company, function(init,item) {
        const companyObj = item.toJSON();
        return _.concat(init,companyObj.companyMonthly);
      },[]);

      const active_report = getReportByMonthly(companyMonthly).value();
      nowdate =  _.now();

      context.res.statusCode = 201;

      context.res.json({
        success: true,
        total:_.size(company_record),
        current:options.skip,
        company_record : _.chain(company_record).slice(options.skip,options.limit).value(),
        chart_info : active_report
      })

    });
  }

  Company.remoteMethod(
      'getRecord',
      {
          description: ['根据查询条件返回报活情况 , 其中:',
                    'filter: company的查询条件',
                    'limit: 返回的记录条数（默认为6）',
                    'skip: 记录开始行数（默认为0）',
                    'year: 报活记录的年份数 （默认为当前年份）',
                    'month: 报活记录的月份数 （默认为当前月份）',
                    'field: 排序字段 （默认为buy 采购量）',
                    'seq: 排序方式 (默认为desc 降序)'],
          accepts: [
              { arg: 'ctx', type: 'object', http: { source:'context' } },
              { arg: 'filter', type: 'object', http:{ source: 'query'} }
          ],
          returns: {
              arg: 'record', type: 'object', root: true
          },
          http: {verb: 'get'}
      }
  );

};
