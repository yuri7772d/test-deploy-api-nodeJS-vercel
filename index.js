var express = require("express");
var cors = require("cors");
var app = express();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const bcrypt = require("bcrypt");
const saltRounds = 10;
var jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const { log } = require("console");
const privateKey = "mxvcn21322dfj";
require('dotenv').config({path: '.env'})

const connection = mysql.createConnection(process.env.DATABASE_URL);

app.use(cors());

app.post("/register", jsonParser, function (req, res, next) {
  try {
    
  const username = req.body.username;
  const password = req.body.password;
  const prefix = req.body.prefix;
  const fname = req.body.fname;
  const lname = req.body.lname;

  connection.execute(
    "SELECT users.username FROM users WHERE username = ?",
    [username],
    (err, users) => {
      if (users.length == 0) {
        bcrypt.hash(password, saltRounds, function (err, hash) {
          connection.execute(
            "INSERT INTO users( username, password, fname, lname, prefix_id) value (?,?,?,?,?)",
            [username, hash, fname, lname, prefix],
            (err, user) => {
              var token = jwt.sign({ username: username }, privateKey, {
                expiresIn: "1h",
              });
              res.json({ token: token });
            }
          );
        });
      } else {
        res.json({ msg: "This username is already taken." });
      }
    }
  );
} catch (error) {
    res.json({msg:error})
}
  // res.json({msg:"post"})
});
app.get("/register", jsonParser, function (req, res, next) {
  try {
    
  console.log("on get prefix");
  connection.execute(
    "SELECT prefix.prefix_name ,prefix.prefix_id FROM prefix",
    (err, data) => {
      res.json({ prefix: data });
    }
  );
} catch (error) {
    res.json({error})
}
});

app.post("/login", jsonParser, function (req, res, next) {
  try {
    
 
  console.log("on login");
  const username = req.body.username;
  const password = req.body.password;

  connection.execute(
    "SELECT users.username, users.password FROM users WHERE username= ?",
    [username],

    (err, user) => {
      if (err) {
        res.json({ msg: err.message });
        return;
      }
      if (user.length == 0) {
        res.json({ msg: "This username does not exist in the system." });
        return;
      }
      console.log(user[0].password);
      bcrypt.compare(password, user[0].password, function (err, result) {
        if (err) {
          res.json({ msg: err.message });
          return;
        }
        if (result) {
          var token = jwt.sign({ username: username }, privateKey, {
            expiresIn: "1h",
          });
          res.json({ token: token });
          return;
        }
        // result == true
        res.json({ msg: "The password is incorrect." });
      });
    }
  );
} catch (error) {
    res.json({msg:error})
}
});

app.get("/myProfile", jsonParser, function (req, res, next) {
  try {
  console.log("on get myProfile");
  var token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, privateKey, function (err, decoded) {
    if (err) {
      res.json({
        stetus: "Error",
        msg: err.message,
      });
      return;
    }

    console.log(decoded.username);
    connection.execute(
      "SELECT users.user_id , prefix.prefix_name,users.fname ,users.lname,sex_names.sex_name FROM prefix INNER JOIN users ON users.prefix_id = prefix.prefix_id INNER JOIN sex_names ON sex_names.sex_id =prefix.sex_id WHERE users.username = ?",
      [decoded.username],
      (err, user) => {
        if (err) {
          res.json({
            status: "Error",
            msg: err.message,
          });
          return;
        }
        res.json({
          user: user[0],
        });
      }
    );
  });
} catch (error) {
    
}
});

app.get("/clubProfile", jsonParser, function (req, res, next) {
  try {
    

  console.log("on get clubProfile");
  var token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, privateKey, function (err, decoded) {
    if (err) {
      res.json({
        status: "Error",
        msg: err.message,
      });
      return;
    }

    console.log(decoded.username);
    connection.execute(
      "SELECT club_names.club_id, club_names.club_name ,club_names.club_comment ,club_status_names.club_status_name FROM club_join INNER JOIN club_names ON club_names.club_id = club_join.club_id INNER JOIN users ON club_join.user_id = users.user_id INNER JOIN club_status_names ON club_join.clud_status_id = club_status_names.clud_status_id WHERE users.username = ?",
      [decoded.username],
      (err, club) => {
        if (err) {
          res.json({
            status: "Error",
            msg: err.message,
          });
          return;
        }
        console.log(club.length);

        if (club.length == 0) {
          res.json({
            msg: `you don't have club.`,
          });
          return;
        }

        res.json({
          club: club[0],
        });
      }
    );
  });
} catch (error) {
    
}
});

app.get("/clubList", jsonParser, function (req, res, next) {
  try {
    
 
  console.log("on get clubList");
  var token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, privateKey, function (err, decoded) {
    if (err) {
      res.json({
        status: "Error",
        msg: err.message,
      });
      return;
    }

    console.log(decoded.username);
    connection.execute(
      "SELECT  club_join.club_id FROM club_join INNER JOIN users ON users.user_id = club_join.user_id WHERE users.username = ?",
      [decoded.username],
      (err, isclub) => {
        if (err) {
          res.json({
            status: "Error",
            msg: err.message,
          });
          return;
        }
        if (isclub.length != 0) {
          res.json({
            msg: "you have clup",
          });
          return;
        }
        connection.execute(
          "SELECT club_names.club_id , club_names.club_name ,club_names.club_comment FROM club_names ",
          (err, club) => {
            if (err) {
              res.json({
                status: "Error",
                msg: err.message,
              });
              return;
            }
            res.json({
              clubList: club,
            });
          }
        );
      }
    );
  });
} catch (error) {
    
}
});

app.get("/member", jsonParser, function (req, res, next) {

  try {
    
 
  console.log("on get club member");
  var token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, privateKey, function (err, decoded) {
    if (err) {
      res.json({
        status: "Error",
        msg: err.message,
      });
      return;
    }

    console.log(decoded.username);
    connection.execute(
      "SELECT  club_join.club_id FROM club_join INNER JOIN users ON users.user_id = club_join.user_id WHERE users.username = ?",
      [decoded.username],
      (err, isclub) => {
        if (err) {
          res.json({
            status: "Error",
            msg: err.message,
          });
          return;
        }
        if (isclub.length == 0) {
          res.json({
            msg: "you don't have club",
          });
          return;
        }
        connection.execute(
          `SELECT users.user_id , prefix.prefix_name ,users.fname, users.lname, club_status_names.club_status_name FROM users 
INNER JOIN club_join ON users.user_id=club_join.user_id 
INNER JOIN prefix ON prefix.prefix_id= users.prefix_id
INNER JOIN club_status_names ON club_status_names.clud_status_id=club_join.clud_status_id
WHERE club_join.club_id=? `,
          [isclub[0].club_id],
          (err, members) => {
            if (err) {
              res.json({
                status: "Error",
                msg: err.message,
              });
              return;
            }
            res.json({
              members: members,
            });
          }
        );
      }
    );
  });
} catch (error) {
    
}
});

app.post("/create", jsonParser, function (req, res, next) {
  try {
    
  console.log("on create");
  console.log(req.headers.authorization);
  var token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, privateKey, function (err, decoded) {
    if (err) {
      res.json({
        status: "Error",
        msg: err.message,
      });
      return;
    }
    connection.execute(
      "SELECT users.user_id FROM users WHERE users.username =? ",
      [decoded.username],
      (err, user) => {
        if (err) {
          res.json({
            status: "Error",
            msg: err.message,
          });
          return;
        }
        console.log(decoded.username);
        connection.execute(
          "SELECT  club_join.club_id FROM club_join INNER JOIN users ON users.user_id = club_join.user_id WHERE users.username = ?",
          [decoded.username],
          (err, isclub) => {
            if (err) {
              res.json({
                status: "Error",
                msg: err.message,
              });
              return;
            }
            if (isclub.length != 0) {
              res.json({
                msg: "you have clup.",
              });
              return;
            }

            connection.execute(
              "INSERT INTO club_names(club_name, club_comment) VALUES (?,?)",
              [req.body.clupname, req.body.clubcomment],
              (err, result) => {
                if (err) {
                  res.json({
                    status: "Error",
                    msg: err.message,
                  });
                  return;
                }
                console.log();

                connection.execute(
                  "INSERT INTO club_join(user_id, club_id, clud_status_id) VALUES (?,?,?)",
                  [user[0].user_id, result.insertId, 3],
                  (err, result) => {
                    if (err) {
                      res.json({
                        status: "Error",
                        msg: err.message,
                      });
                      return;
                    }
                    res.json({
                      status: "ok",
                      msg: "create club success.",
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
} catch (error) {
    res.json({msg : error})
}
});

app.post("/join", jsonParser, function (req, res, next) {
  try{
  console.log("on join");
  console.log(req.headers.authorization);
  var token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, privateKey, function (err, decoded) {
    if (err) {
      res.json({
        status: "Error",
        msg: err.message,
      });
      return;
    }
    connection.execute(
      "SELECT users.user_id FROM users WHERE users.username =? ",
      [decoded.username],
      (err, user) => {
        if (err) {
          res.json({
            status: "Error",
            msg: err.message,
          });
          return;
        }
        console.log(decoded.username);
        connection.execute(
          "SELECT  club_join.club_id FROM club_join INNER JOIN users ON users.user_id = club_join.user_id WHERE users.username = ?",
          [decoded.username],
          (err, isclub) => {
            if (err) {
              res.json({
                status: "Error",
                msg: err.message,
              });
              return;
            }
            if (isclub.length != 0) {
              res.json({
                msg: "you have clup.",
              });
              return;
            }
            var genClubStatusId = 1;
            connection.execute(
              "SELECT club_join.user_id, club_join.clud_status_id FROM club_join WHERE club_join.club_id = ? ORDER BY club_join.clud_status_id DESC",
              [req.body.clubId],
              (err, re) => {
                if (err) {
                  res.json({
                    status: "Error sql",
                    msg: err.message,
                  });
                  return;
                }
                if (re.length == 0) {
                  genClubStatusId = 3;
                }

                console.log(genClubStatusId);

                connection.execute(
                  "INSERT INTO club_join(user_id, club_id, clud_status_id) VALUES (?,?,?)",
                  [user[0].user_id, req.body.clubId, genClubStatusId],
                  (err, result) => {
                    if (err) {
                      res.json({
                        status: "Error",
                        msg: err.message,
                      });
                      return;
                    }
                    res.json({
                      status: "ok",
                      msg: "join club success.",
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
} catch (error) {
    
}
});

app.post("/outClub", jsonParser, function (req, res, next) {
  try{
  console.log("on out Club");

  var token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, privateKey, function (err, decoded) {
    if (err) {
      res.json({
        status: "Error",
        msg: err.message,
      });
      return;
    }

    console.log(decoded.username);
    connection.execute(
      "SELECT  club_join.club_id, club_join.clud_status_id, users.user_id FROM club_join INNER JOIN users ON users.user_id = club_join.user_id WHERE users.username = ?",
      [decoded.username],
      (err, user) => {
        if (err) {
          res.json({
            status: "Error sql",
            msg: err.message,
          });
          return;
        }
        if (user.length == 0) {
          res.json({
            msg: "you don't have clup.",
          });
          return;
        }

        if (req.body.userId) {
          console.log(req.body.userId);
        } else {
          connection.execute(
            "DELETE FROM `club_join` WHERE club_join.user_id = ?",
            [user[0].user_id],
            (err, re) => {
              if (err) {
                res.json({
                  status: "Error sql",
                  msg: err.message,
                });
                return;
              }
              if (user[0].clud_status_id == 3) {
                console.log("fffffffffffffffffff");
                connection.execute(
                  "SELECT club_join.user_id, club_join.clud_status_id FROM club_join WHERE club_join.club_id = ? ORDER BY club_join.clud_status_id DESC",
                  [user[0].club_id],
                  (err, reg) => {
                    if (err) {
                      res.json({
                        status: "Error sql",
                        msg: err.message,
                      });
                      return;
                    }
                    console.log(reg[0]);
                    if (reg.length != 0) {
                      connection.execute(
                        "UPDATE club_join SET clud_status_id = 3 WHERE user_id= ?",
                        [reg[0].user_id],
                        (err, re) => {
                          if (err) {
                            res.json({
                              status: "Error sql",
                              msg: err.message,
                            });

                            return;
                          }
                        }
                      );
                    }
                  }
                );
              }
              res.json({
                status: "ok",
                msg: "you out club",
              });
              return;
            }
          );
        }

        try {
          console.log("ok");
        } catch (error) {
          console.log("err");
        }

        console.log(user);
      }
    );
  });
} catch (error) {
    
}
});

app.post("/deleteClub", jsonParser, function (req, res, next) {
  try{
  console.log("on Delete Club");

  var token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, privateKey, function (err, decoded) {
    if (err) {
      res.json({
        status: "Error",
        msg: err.message,
      });
      return;
    }

    console.log(decoded.username);
    connection.execute(
      "SELECT users.user_id, club_join.club_id, club_join.clud_status_id FROM club_join INNER JOIN users ON users.user_id = club_join.user_id WHERE users.username = ?",
      [decoded.username],
      (err, user) => {
        if (err) {
          res.json({
            status: "Error sql1",
            msg: err.message,
          });
          return;
        }
        if (user.length == 0) {
          res.json({
            msg: "you don't have clup.",
          });
          return;
        }
        console.log("clup status id =" + user[0].clud_status_id);

        if (user[0].clud_status_id == 3) {
          connection.execute(
            "DELETE FROM club_names WHERE club_names.club_id = ?",
            [user[0].club_id],
            (err, re) => {
              if (err) {
                console.log("err");
                res.json({
                  status: "Error sql",
                  msg: err.message,
                });
                return;
              }

              connection.execute(
                "DELETE FROM club_join WHERE club_join.club_id = ?",
                [user[0].club_id],
                (er, re) => {
                  console.log("ert");
                  if (er) {
                    res.json({
                      status: "Error sql",
                      msg: er.message,
                    });
                    return;
                  }
                }
              );
              res.json({
                status: "ok",
                msg: "delete success",
              });
              return;
            }
          );
        } else {
          res.json({
            status: "Error ",
            msg: "Unable to delete club.",
          });
        }

        try {
          console.log("ok");
        } catch (error) {
          console.log("err");
        }
      }
    );
  });
} catch (error) {
    
}
});

app.get("/", jsonParser, function (req, res, next) {
  res.json({ msg:"wellcom"});
});


app.listen(process.env.POST || 100, function () {
  console.log("CORS-enabled web server listening on port 100");
});


module.exports = app 