const express = require("express");
const app = express();

app.use(express.json({ extended: false }));
app.use("/api/class", require("./timetable"));

const port = 8080;
app.listen(port, () => {
  console.log(`SERVER WORKING AT ${port}`);
});
