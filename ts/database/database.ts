const mysql = require("mysql2/promise");
const bluebird = require('bluebird')

const connection = mysql
  .createConnection({
    host: "localhost",
    port: "8889",
    user: "root",
    password: "root",
    // socket: '/Applications/MAMP/tmp/mysql/mysql.sock',
    database: "eCommerce",
    Promise: bluebird
  })
  .then(console.log("DB connected"))
  .catch((err: any) => console.log(err));




export { connection };
