const express = require('express')
const path = require('path')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose();
var moment = require('moment')
let dbLoc = __dirname + "/public/database.db";
let db = new sqlite3.Database(dbLoc, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    throw err
  }
})



app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  const url = req.url == "/" ? "/?page=1" : req.url;
  let sql2 = 'SELECT COUNT (*) as total FROM data;'
  let sql = 'SELECT * FROM data limit 3 offset 0;'
  const page = parseInt(req.query.page) || 1;
  const limitTab = 3
  let offset = (page - 1) * limitTab;
  let string = req.query.string;
  let integer = parseInt(req.query.integer);
  let float = parseFloat(req.query.float);
  let start = req.query.start;
  let end = req.query.end;
  let boolean = req.query.boolean;
  let params = [];

  if (page) {
    sql = `SELECT * FROM data limit ${limitTab} offset ${offset}`;
  }
  if (string || integer || float || start || end || boolean) {
    params.push({ string: string, integer, float, start, end, boolean });
  }
  if (params.length) {
    sql = `SELECT * FROM data WHERE `;
    sql2 = `SELECT COUNT (*) as total FROM data WHERE`;

    let flag = 0;
    let limit = ` limit 3 offset ${offset}`;
    if (params[0].string) {
      sql += ` string like '%${params[0].string}%' `;
      sql2 += ` string like '%${params[0].string}%' `;
      flag = 1;
    }
    if (params[0].integer) {
      if (flag == 1) {
        sql += ` AND`;
        sql2 += ` AND`;
      }
      sql += ` integer = ${params[0].integer} `;
      sql2 += ` integer = ${params[0].integer} `;
      flag = 1;
    }
    if (params[0].float) {
      if (flag == 1) {
        sql += ` AND`;
        sql2 += ` AND`;
      }
      sql += ` float = ${params[0].float} `;
      sql2 += ` float = ${params[0].float} `;
      flag = 1;
    }
    if (params[0].start && params[0].end) {
      if (flag == 1) {
        sql += ` AND`;
        sql2 += ` AND`;
      }
      sql += ` date between '${params[0].start}' and '${params[0].end}' `;
      sql2 += ` date between '${params[0].start}' and '${params[0].end}' `;
      flag = 1;
    }
    if (params[0].boolean) {
      if (flag == 1) {
        sql += ` AND`;
        sql2 += ` AND`;
      }
      sql += ` boolean = '${params[0].boolean}' `;
      sql2 += ` boolean = '${params[0].boolean}' `;
    }
    sql += ` ${limit}`;
  }

  db.all(sql2, [], (err, data) => {
    if (err) {
      throw err
    }

    let totalPage = data[0].total;

    let pages = Math.ceil(totalPage / limitTab)
    db.all(sql, [], (err, data) => {
      if (err) {
        throw err
      }
      res.render('index', { data: data, moment: moment, totalPage, page, pages, url, string, integer, float, start, end, boolean })
    })
  })

})

app.get('/add', (req, res) => {
  res.render('add')
})

app.post('/add', (req, res) => {
  let sql = `INSERT INTO data(string,integer,float,date,boolean)VALUES("${req.body.string}","${req.body.integer}","${req.body.float}","${req.body.date}","${req.body.boolean}");`
  db.run(sql, (err) => {
    if (err) {
      throw err
    }
  });
  res.redirect('/')
})
app.get('/delete/:id', (req, res) => {
  let index = req.params.id;
  let sql = `DELETE FROM data WHERE id = '${index}'`
  db.run(sql, (err) => {
    if (err) {
      throw err
    }
    res.redirect('/')
  })

})

app.get('/edit/:id', (req, res) => {
  let index = req.params.id;
  let sql = `SELECT * FROM data WHERE id = ${index};`
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err
    }
    res.render('edit', { data: rows[0] })
  })

})
app.post('/edit/:id', (req, res) => {
  let sql = `UPDATE data SET string = "${req.body.string}",integer = "${req.body.integer}",float = "${req.body.float}",date = "${req.body.date}" ,boolean = "${req.body.boolean}" WHERE id = ${req.params.id};`
  db.run(sql, (err) => {

    if (err) { throw err }
  });
  res.redirect('/')
})



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})