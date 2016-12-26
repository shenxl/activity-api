'use strict';
const CONTAINERS_URL = './server/storage';
const XLSX = require('xlsx');
const constant = require('../utils/constant.js');

module.exports = function(Import) {
  Import.companyInfo = function(ctx, options, cb) {
    if (!options) options = {};
    ctx.req.params.container = 'import';
    const workbook = XLSX.readFile(`${CONTAINERS_URL}/import/${'test.xlsx'}`);
    const sheet_name_list = workbook.SheetNames;
    const company = Import.app.models.company;
    const companyOrder = Import.app.models.companyOrder;
    const companySn = Import.app.models.companySn;

    const data = [];
    sheet_name_list.forEach(
      (name) => {
        if (name === 'data') {
          var worksheet = workbook.Sheets[name];
          var headers = {};

          for (let cell in worksheet) {
            if (cell[0] === '!') continue;
            //parse out the column, row, and value
            var index = 0;
            for (var i = 0; i < cell.length; i++) {
              if (!isNaN(cell[i])) {
                index = i;
                break;
              }
            };
            var col = cell.substring(0, index);
            var row = parseInt(cell.substring(index));
            var value = worksheet[cell].v;

            //store header names
            if (row == 1 && value) {
              headers[col] = constant.DIC[value];
              continue;
            }

            if (!data[row]) data[row] = {};
            data[row][headers[col]] = value;
          }
          //drop those first two rows which are empty
          data.shift();
          data.shift();
        }
      });

    data.forEach((importData) => {
      var companyId = company.find({where: {name: importData.company_name}})
        .then((finds) => {
          if (finds.length !== 0) {
            const companyId = finds[0].id;
            const companyOrderItem = {
              company_id: companyId,
              sns: importData.order_sn,
              order_number: importData.order_number,
              order_type: importData.order_type,
              order_area: importData.order_area,
              order_name: importData.order_name,
              prediction: importData.order_prediction,
              after_authorization: importData.order_afterAuthNum,
              authorization_date: importData.authorization_date,
              authorization_years: importData.authorization_years,
              service_date: importData.service_date,
              length_of_service: importData.length_of_service,
            };
            companyOrder.create(companyOrderItem).then((item) => {
              console.log('create order', item);
            }).catch(err => cb(err));

            importData.order_sn.split(',').forEach((snItem) => {
              companySn.find({where: {sn: snItem}}).then((findsn) => {
                if (findsn.length === 0) {
                  const companySnItem = {
                    company_id: companyId,
                    sn: snItem,
                  };
                  companySn.create(companySnItem).then((item) => {
                    console.log('create sn', item);
                  }).catch(err => cb(err));
                } });
            });
          } else {
            const companyItem = {
              name: importData.company_name,
              region: importData.company_region,
              province: importData.company_province,
              city: importData.company_city,
              county: importData.company_country,
              address: importData.company_address,
              type: importData.company_type,
              industry: importData.company_industry,
            };
            company.create(companyItem).then((result) => {
              const new_companyId = result.id;
              const companyOrderItem = {
                company_id: new_companyId,
                sns: importData.order_sn,
                order_number: importData.order_number,
                order_type: importData.order_type,
                order_area: importData.order_area,
                order_name: importData.order_name,
                prediction: importData.order_prediction,
                after_authorization: importData.order_afterAuthNum,
                authorization_date: importData.authorization_date,
                authorization_years: importData.authorization_years,
                service_date: importData.service_date,
                length_of_service: importData.length_of_service,
              };
              companyOrder.create(companyOrderItem).then((item) => {
                console.log('create order', item);
              }).catch(err => cb(err));

              importData.order_sn.split(',').forEach((snItem) => {
                companySn.find({where: {sn: snItem}}).then((findsn) => {
                  if (findsn.length === 0) {
                    const companySnItem = {
                      company_id: new_companyId,
                      sn: snItem,
                    };
                    companySn.create(companySnItem).then((item) => {
                      console.log('create sn', item);
                    }).catch(err => cb(err));
                  } });
              });
            }).catch(err => cb(err));
          }
        }).catch(err => cb(err));
    });
    console.log('导入结束');
    cb();
  };

  Import.remoteMethod(
    'companyInfo', {
      description: '导入企业信息',
      accepts: [{
        arg: 'ctx',
        type: 'object',
        http: {
          source: 'context',
        },
      }, {
        arg: 'options',
        type: 'object',
        http: {
          source: 'query',
        },
      }],
      returns: {
        arg: 'fileObject',
        type: 'object',
        root: true,
      },
      http: {
        verb: 'get',
      },
    }
  );
};
