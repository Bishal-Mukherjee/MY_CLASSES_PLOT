const { GoogleSpreadsheet } = require("google-spreadsheet");
require("dotenv").config();

const markStudentAttendence = async (
  currentClassTimingIndex,
  rows,
  startIndex,
  endIndex,
  user
) => {
  const { userId } = user;

  for (let i = startIndex + 1; i < endIndex; i++) {
    let row = rows[i];
    if (row._rawData[0] == userId) {
      row._rawData[currentClassTimingIndex] = "PRESENT";
      await row.save();
    }
  }

  return "MARKED_SUCCESSFULLY";
  // completed students attendence.
};

const markClassBlock = (currentClassTimingIndex, rows, department, user) => {
  let startIndex = 0,
    endIndex = 0;
  let markStudentAttendenceResponse = "";
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]._rawData.length == 1) {
      if (rows[i]._rawData[0] == `${department}-START`) {
        startIndex = i;
      }
      if (rows[i]._rawData[0] == `${department}-END`) {
        endIndex = i;
      }
    }
  }

  markStudentAttendenceResponse = markStudentAttendence(
    currentClassTimingIndex,
    rows,
    startIndex,
    endIndex,
    user
  );

  return markStudentAttendenceResponse;
};

const markAttendence = async (currentClassTimingIndex, department, user) => {
  const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);
  let markClassBlockResponse = "";

  await doc.useServiceAccountAuth({
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY,
  });

  await doc.loadInfo();

  let sheet = doc.sheetsByIndex[1];

  let rows = await sheet.getRows();

  markClassBlockResponse = markClassBlock(
    currentClassTimingIndex,
    rows,
    department,
    user
  );

  return markClassBlockResponse;
};

module.exports = { markAttendence };
