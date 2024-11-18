const IpFilter = require('express-ipfilter').IpFilter;

const whiteList = ['::1', '192.168.0.0/16', '::ffff:127.0.0.1'];
const ipWhitelist = IpFilter(whiteList, { mode: 'allow', allowedHeaders: ['x-forwarded-for'] });

module.exports = ipWhitelist;
