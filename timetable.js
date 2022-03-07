const express = require("express");
const router = express.Router();
const { GoogleSpreadsheet } = require("google-spreadsheet");
// const { markAttendence } = require("./attendencelist");
const moment = require("moment");
require("dotenv").config();

const getCurrentTimeIndex = (classTimings) => {
  let date = new Date();
  let foundClassTimingIndex = 0;

  if (moment(date).minute().toString().length === 1) {
    let formattedCurrentTiming =
      moment(date).hour() + ":" + "0" + moment(date).minute();
    let tempTimeIndex = 0;

    for (let i = 0; i < classTimings.length; i++) {
      if (i !== 0) {
        if (classTimings[i] <= formattedCurrentTiming) {
          if (i > tempTimeIndex) {
            tempTimeIndex = i;
          }
        }
      }
    }
    foundClassTimingIndex = tempTimeIndex;
  } else {
    let formattedCurrentTiming =
      moment(date).hour() + ":" + moment(date).minute();

    let tempTimeIndex = 0;

    for (let i = 0; i < classTimings.length; i++) {
      if (i !== 0) {
        if (classTimings[i] <= formattedCurrentTiming) {
          if (i > tempTimeIndex) {
            tempTimeIndex = i;
          }
        }
      }
    }
    foundClassTimingIndex = tempTimeIndex;
  }
  return foundClassTimingIndex;
};

const getDay = (dayIndex) => {
  if (dayIndex === 0) {
    return "SUNDAY";
  }
  if (dayIndex === 1) {
    return "MONDAY";
  }
  if (dayIndex === 2) {
    return "TUESDAY";
  }
  if (dayIndex === 3) {
    return "WEDNESDAY";
  }
  if (dayIndex === 4) {
    return "THURSDAY";
  }
  if (dayIndex === 5) {
    return "FRIDAY";
  }
  if (dayIndex === 6) {
    return "SATURDAY";
  }
};

const getTimeTable = (startIndex, endIndex, rows) => {
  let date = new Date();
  let dayOfWeek = getDay(moment(date).day());
  let classTimings = rows[startIndex + 1]._rawData;
  let currentClassTimingIndex = getCurrentTimeIndex(classTimings);
  let todaysClassList = [];
  // let markAttendenceResponse = "";

  for (let i = startIndex + 1; i < endIndex; i++) {
    if (dayOfWeek === rows[i]._rawData[0]) {
      todaysClassList = rows[i]._rawData;
    }
  }

  // if (todaysClassList[currentClassTimingIndex] == facultyName) {
  // console.log(
  //   currentClassTimingIndex,
  //   " ",
  //   todaysClassList[currentClassTimingIndex]
  // );
  // markAttendenceResponse = markAttendence(
  //   currentClassTimingIndex,
  //   dept,
  //   user
  // );
  // }

  // return markAttendenceResponse;
  return {
    classTimingIndex: currentClassTimingIndex,
    facultyName: todaysClassList[currentClassTimingIndex],
  };
};

// this endpoint is triggered on website render
router.post("/currentClassDetails/:classYear", async (req, res) => {
  const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);
  // const { facultyName } = req.body;
  const { classYear } = req.params;
  // facultyName
  // user:{ userId } userId=BCA/20/810
  // classYear: BCA-2ND-YEAR / BCA-1ST-YEAR
  let responseObject = {};

  await doc.useServiceAccountAuth({
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY,
  });

  await doc.loadInfo();

  let sheet = doc.sheetsByIndex[0];

  let startIndex = 0,
    endIndex = 0;

  let rows = await sheet.getRows();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]._rawData.length == 1) {
      if (rows[i]._rawData[0] == `${classYear}-START`) {
        startIndex = i;
      }
      if (rows[i]._rawData[0] == `${classYear}-END`) {
        endIndex = i;
      }
    }
  }

  responseObject = getTimeTable(startIndex, endIndex, rows);

  return res.status(200).json({ responseObject });
});

/* list of absentees */
const createAbseenteesList = (attendenceOfEach, classTimeIndex) => {
  let absentees = [];
  attendenceOfEach.map((aoe) => {
    if (aoe[classTimeIndex] !== "PRESENT") absentees.push(aoe[0]);
  });
  return absentees;
  // completed fetch absent list.
};

const getClassTimeIndex = (startIndex, endIndex, rows, classTime) => {
  let classTimings = [];
  let attendenceOfEach = [];
  let absentees = [];

  for (let i = startIndex + 1; i < endIndex; i++) {
    if (i == startIndex + 1) classTimings = rows[i]._rawData;
    else {
      attendenceOfEach.push(rows[i]._rawData);
    }
  }

  if (classTimings.length !== 0) {
    classTimings.map((ct, index) => {
      if (ct == classTime) {
        absentees = createAbseenteesList(attendenceOfEach, index);
      }
    });
  }
  return absentees;
};

router.post("/absents", async (req, res) => {
  const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);
  const { department, classTime } = req.body;
  let absentees = [];

  await doc.useServiceAccountAuth({
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY,
  });

  await doc.loadInfo();

  let sheet = doc.sheetsByIndex[1];
  let rows = await sheet.getRows();

  let startIndex = 0,
    endIndex = 0;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i]._rawData[0] == `${department}-START`) {
      startIndex = i;
    }
    if (rows[i]._rawData[0] == `${department}-END`) {
      endIndex = i;
    }
  }

  absentees = getClassTimeIndex(startIndex, endIndex, rows, classTime);
  return res.status(200).json({ absentees });
});

module.exports = router;
