const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const path = require("path");
//const session = require("express-session");
const ejs = require("ejs");
require("dotenv").config();
var cookieSession = require("cookie-session");
const { DateTime } = require("luxon");

app.set("view engine", "ejs");
app.use(express.static("resources"));
app.use(bodyParser.urlencoded({ extended: true }));
/*app.use(
  session({
    secret: [process.env.SESSION_KEY],
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);*/
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_KEY],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

const homepageQueryMiddleWare = (req, res, next) => {
  if (req.query.hasOwnProperty("name") && req.query.hasOwnProperty("email")) {
    next();
  } else {
    res.send("Name and/or email not entered.");
  }
};

const authenticationMiddleWare = (req, res, next) => {
  if (req.session.hasOwnProperty("user_id")) {
    next();
  } else {
    res.redirect("/login.html");
  }
};

const con = mysql.createConnection(process.env.MYSQL_CON_STRING);

con.connect((err) => {
  if (err) throw err;
  else console.log("Connected to MySQL.");
});

//in get request you have req.query object
app.get("/", homepageQueryMiddleWare, (req, res) => {
  con.query(`INSERT INTO Users (name, email) VALUES ('${req.query.name}', '${req.query.email}')`, (err, result) => {
    if (err) throw res.send(err);
    else res.send(`Hello ${req.query.name}. Welcome to firstDB. Your name has been entered`);
  });
});

//in POST request you use middleware body-parser then have req.body object
app.post("/signup", (req, res) => {
  bcrypt.hash(req.body.password, 10, (err, hashed_password) => {
    if (err) throw err;
    con.query(
      `INSERT INTO Users (name, email, password) VALUES ('${req.body.name}', '${req.body.email}', '${hashed_password}')`,
      (err, result) => {
        if (err) res.send(err);
        else {
          res.redirect("/login.html");
        }
      }
    );
  });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const text_password = req.body.password;
  con.query(`SELECT id, name, password FROM Users WHERE email='${email}'`, (err, result) => {
    if (err) res.sendStatus(500);
    else {
      const correct_password_hash = result[0].password;
      bcrypt.compare(text_password, correct_password_hash, (err, comparison_result) => {
        if (comparison_result) {
          req.session.user_id = result[0].id;
          req.session.name = result[0].name;
          res.redirect("/feed");
        } else res.sendStatus(401);
      });
    }
  });
});

app.get("/logout", authenticationMiddleWare, (req, res) => {
  req.session = null;
  res.redirect("/login.html");
});

app.get("/myprofile", authenticationMiddleWare, (req, res) => {
  res.render("myprofile.ejs", {
    name: req.session.name,
  });
});

app.get("/feed", authenticationMiddleWare, (req, res) => {
  res.render("feed.ejs", {
    name: req.session.name,
    user_id: req.session.user_id,
  });
});

app.post("/post/new", authenticationMiddleWare, (req, res) => {
  if (req.body.hasOwnProperty("content") && req.body.content != "") {
    con.query(
      `INSERT INTO Posts (content, user_id) VALUES (?, ?)`,
      [req.body.content, req.session.user_id],
      (err, result) => {
        if (err) res.sendStatus(500);
        else res.sendStatus(201);
      }
    );
  } else res.sendStatus(400);
});

app.get("/post/all", authenticationMiddleWare, (req, res) => {
  con.query(
    `SELECT Posts.id, Posts.content, Posts.date_posted, Users.name, Users.id AS user_id FROM Posts INNER JOIN Users ON Posts.user_id=Users.id ORDER BY id DESC;`,
    (err, result) => {
      if (err) res.sendStatus(500);
      else {
        const final = result.map((post) => {
          post.date_posted = DateTime.fromJSDate(post.date_posted).toFormat("dd LLL yyyy");
          return post;
        });
        res.json(final);
      }
    }
  );
});

app.post("/post/delete", authenticationMiddleWare, (req, res) => {
  con.query(`DELETE FROM Posts WHERE id='${req.body.post_id}'`, (err, result) => {
    if (err) res.send(err);
    else res.redirect("/feed");
  });
});

app.listen(3000, () => {
  console.log("server listening on port 3000.");
});
