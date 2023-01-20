const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const cron = require("node-cron");

const PORT = 4000;
const app = express();

app.use(express.json({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

const db = new sqlite3.Database("./wheel_db.db", (err) => {
  if (err) {
    console.error("Error opening database " + err.message);
  } else {
    db.run(
      `CREATE TABLE  IF NOT EXISTS users(
            telegram_id INTEGER PRIMARY KEY NOT NULL,
            telegram_username TEXT,
            points INTEGER,
            tryCount INTEGER,
            openApp INTEGER
        )`,
      (err) => {
        if (err) {
          console.log("Table already exists. ", err);
        }
      }
    );
    db.run(
      `CREATE TABLE  IF NOT EXISTS referrals(
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            referrer_id INTEGER,
            referral_id INTEGER,
            is_active INTEGER
        )`,
      (err) => {
        if (err) {
          console.log("Table already exists. ", err);
        }
      }
    );
    db.run(
      `CREATE TABLE  IF NOT EXISTS stats(
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            open_bot INTEGER,
            end_game INTEGER,
            open_ref INTEGER
        )`,
      (err) => {
        if (err) {
          console.log("Table already exists. ", err);
        }
      }
    );
  }
});

app.get("/api/stats", (req, res, next) => {
  db.all("SELECT * FROM stats", [], (err, stats) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json({ stats });
  });
});

app.get("/api/stats/open", (req, res, next) => {
  let value;
  db.all("SELECT * FROM stats where id = ?", [1], (err, stats) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    value = stats;
    console.log(value);
    //res.status(200).json({ stats });
    if (value.length > 0) {
      db.run(
        `UPDATE stats set open_bot = ?, end_game = ?, open_ref = ? WHERE id = 1`,
        [value[0].open_bot + 1, value[0].end_game, value[0].open_ref],
        function (err, result) {
          if (err) {
            res.status(400).json({ error: res.message });
            return;
          }
          res.status(200).json(result);
        }
      );
    } else {
      db.run(
        `INSERT INTO stats (open_bot, end_game, open_ref) VALUES (?,?,?)`,
        [1, 0, 0],
        function (err, result) {
          if (err) {
            res.status(400).json({ error: err.message });
            return;
          }
          res.status(201).json({
            result,
          });
        }
      );
    }
  });
});

app.get("/api/stats/end", (req, res, next) => {
  let value;
  db.all("SELECT * FROM stats where id = ?", [1], (err, stats) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    value = stats;
    console.log(value);
    //res.status(200).json({ stats });
    if (value.length > 0) {
      db.run(
        `UPDATE stats set open_bot = ?, end_game = ?, open_ref = ? WHERE id = 1`,
        [value[0].open_bot, value[0].end_game + 1, value[0].open_ref],
        function (err, result) {
          if (err) {
            res.status(400).json({ error: res.message });
            return;
          }
          res.status(200).json(result);
        }
      );
    } else {
      db.run(
        `INSERT INTO stats (open_bot, end_game, open_ref) VALUES (?,?,?)`,
        [0, 1, 0],
        function (err, result) {
          if (err) {
            res.status(400).json({ error: err.message });
            return;
          }
          res.status(201).json({
            result,
          });
        }
      );
    }
  });
});

app.get("/api/stats/ref", (req, res, next) => {
  let value;
  db.all("SELECT * FROM stats where id = ?", [1], (err, stats) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    value = stats;
    console.log(value);
    //res.status(200).json({ stats });
    if (value.length > 0) {
      db.run(
        `UPDATE stats set open_bot = ?, end_game = ?, open_ref = ? WHERE id = 1`,
        [value[0].open_bot, value[0].end_game, value[0].open_ref + 1],
        function (err, result) {
          if (err) {
            res.status(400).json({ error: res.message });
            return;
          }
          res.status(200).json(result);
        }
      );
    } else {
      db.run(
        `INSERT INTO stats (open_bot, end_game, open_ref) VALUES (?,?,?)`,
        [0, 0, 1],
        function (err, result) {
          if (err) {
            res.status(400).json({ error: err.message });
            return;
          }
          res.status(201).json({
            result,
          });
        }
      );
    }
  });
});

app.get("/api/referrals/", (req, res, next) => {
  const params = [req.params.id];

  db.all("SELECT * FROM referrals", [], (err, referrals) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json(referrals);
  });
});

app.post("/api/referrals/", (req, res, next) => {
  const reqBody = req.body;
  db.run(
    `INSERT INTO referrals (referrer_id, referral_id, is_active) VALUES (?,?,?)`,
    [reqBody.referrer_id, reqBody.referral_id, reqBody.is_active],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(201).json({
        referrer_id: this.lastID,
      });
    }
  );
});

app.put("/api/referrals/", (req, res, next) => {
  console.log(req.body);
  const reqBody = req.body;
  db.run(
    `UPDATE referrals set referrer_id = ?, referral_id = ?, is_active = ? WHERE id = ?`,
    [reqBody.referrer_id, reqBody.referral_id, reqBody.is_active, reqBody.id],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: res.message });
        return;
      }
      res.status(200).json(result);
    }
  );
});

app.get("/api/users/:id", (req, res, next) => {
  console.log([req.params.id]);
  const params = [req.params.id];
  db.get(
    `SELECT * FROM users where telegram_id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(200).json(row);
    }
  );
});

app.get("/api/users", (req, res, next) => {
  db.all("SELECT * FROM users", [], (err, users) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json({ users });
  });
});

app.post("/api/users/", (req, res, next) => {
  const reqBody = req.body;
  db.run(
    `INSERT INTO users (telegram_id, telegram_username, points, tryCount, openApp) VALUES (?,?,?,?,?)`,
    [
      reqBody.telegram_id,
      reqBody.telegram_username,
      reqBody.points,
      reqBody.tryCount,
      reqBody.openApp,
    ],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(201).json({
        telegram_id: this.lastID,
      });
    }
  );
});

app.put("/api/users/", (req, res, next) => {
  console.log("put ", req.body);

  const reqBody = req.body;
  db.run(
    `UPDATE users set telegram_username = ?, points = ?, tryCount = ?, openApp = ? WHERE telegram_id = ?`,
    [
      reqBody.telegram_username,
      reqBody.points,
      reqBody.tryCount,
      reqBody.openApp,
      reqBody.telegram_id,
    ]
  );

  db.get(
    `SELECT * FROM users where telegram_id = ?`,
    reqBody.telegram_id,
    (err, row) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(200).json(row);
    }
  );
});

async function start() {
  app.listen(PORT, () =>
    console.log(`App has benn started on port ${PORT}...`)
  );
}

start();
