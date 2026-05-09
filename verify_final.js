const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("C:/Marcha/database.sqlite");
db.serialize(() => {
  db.get("SELECT count(*) as c FROM scores WHERE athlete_id = 10037", (err, r) => console.log("scores_amanda:", r ? r.c : "err"));
  db.get("SELECT count(*) as c FROM house_points_log WHERE student_id = 10037", (err, r) => console.log("log_amanda:", r ? r.c : "err"));
  db.get("SELECT count(*) as c FROM scores WHERE athlete_id = 10009", (err, r) => console.log("scores_glaubert:", r ? r.c : "err"));
  db.get("SELECT count(*) as c FROM house_points_log WHERE student_id = 10009", (err, r) => console.log("log_glaubert:", r ? r.c : "err"));
  db.close();
});
