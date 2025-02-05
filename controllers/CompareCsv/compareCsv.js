const path = require("path");
const fs = require("fs");
const csvToJson = require("../../services/csvExtractor");
const { parse } = require("json2csv");

function isBlank(str) {
  return !str.trim().length;
}

// Function to group and sort by PRIMARY key
function groupByPrimaryKey(arr) {
  const grouped = {};

  arr.forEach((item) => {
    const primaryKey = item["PRIMARY"].trim();
    if (!grouped[primaryKey]) {
      grouped[primaryKey] = {
        PRIMARY_KEY: item["PRIMARY KEY"],
        IMAGE_NAME: item["IMAGE_NAME"],
        DATA: [],
      };
    }
    const dataItem = { ...item };
    delete dataItem["PRIMARY"];
    delete dataItem["PRIMARY KEY"];
    delete dataItem["IMAGE_NAME"];
    grouped[primaryKey].DATA.push(dataItem);
  });

  return Object.keys(grouped).map((key) => ({
    PRIMARY: key,
    PRIMARY_KEY: grouped[key].PRIMARY_KEY,
    IMAGE_NAME: grouped[key].IMAGE_NAME,
    DATA: grouped[key].DATA,
  }));
}

const compareCsv = async (req, res) => {
  try {
    // Access other form data parameters
    const {
      firstInputFileName,
      secondInputFileName,
      primaryKey,
      skippingKey,
      imageColName,
      formFeilds,
      zipImageFile,
    } = req.body;


    const firstFilePath = path.join(
      __dirname,
      "../",
      "../",
      "COMPARECSV_FILES",
      "multipleCsvCompare",
      firstInputFileName
    );
    const secondFilePath = path.join(
      __dirname,
      "../",
      "../",
      "csvFile",
      secondInputFileName
    );
    // console.log("file name" ,secondFilePath, "secondInputFileName")
    const f1 = await csvToJson(firstFilePath);
    const f2 = await csvToJson(secondFilePath);
    console.log(f1,"------")
    f2.splice(0,1);
    // console.log(primaryKey, "primary key");
    const diff = [];

    // Logging for debugging
    // console.log("First CSV data:", f1);
    // console.log("Second CSV data:", f2[1][primaryKey]);
    // console.log(f1,"f1")
    for (let i = 0; i < f1.length; i++) {
      if (isBlank(f1[i][primaryKey])) {
        return res
          .status(501)
          .send({ err: "Primary key cannot be blank in the first CSV file" });
      }
    }

    for (let j = 0; j < f2.length; j++) {
      if (isBlank(f2[j][primaryKey])) {
        return res
          .status(501)
          .send({ err: "Primary key cannot be blank in the second CSV file" });
      }
    }

    for (let i = 0; i < f1.length; i++) {
      for (let j = 0; j < f2.length; j++) {
        const pkLength = f1[i][primaryKey].length;
        const str = " ".repeat(pkLength);

        if (
          f1[i][primaryKey] === f2[j][primaryKey] &&
          f1[i][primaryKey] !== str &&
          f2[j][primaryKey] !== str
        ) {
          for (let [key, value] of Object.entries(f1[i])) {
            const val1 = value;
            const val2 = f2[j][key];
            const imgPathArr = f1[i][imageColName]?.split("\\");
            const imgName = imgPathArr[imgPathArr.length - 1];

            if (
              val1.includes("*") ||
              val2.includes("*") ||
              /^\s*$/.test(val1) ||
              /^\s*$/.test(val2)
            ) {
              if (!skippingKey.includes(key) && formFeilds.includes(key)) {
                const obj = {
                  PRIMARY: ` ${f1[i][primaryKey]}`,
                  COLUMN_NAME: key,
                  FILE_1_DATA: val1,
                  FILE_2_DATA: val2,
                  IMAGE_NAME: imgName,
                  CORRECTED: "",
                  "CORRECTED BY": "",
                  "PRIMARY KEY": primaryKey,
                };
                diff.push(obj);
              }
            } else if (value !== f2[j][key]) {
              if (!skippingKey.includes(key)) {
                const obj = {
                  PRIMARY: ` ${f1[i][primaryKey]}`,
                  COLUMN_NAME: key,
                  FILE_1_DATA: val1,
                  FILE_2_DATA: val2,
                  IMAGE_NAME: imgName,
                  CORRECTED: "",
                  "CORRECTED BY": "",
                  "PRIMARY KEY": primaryKey,
                };
                diff.push(obj);
              }
            }
          }
        }
      }
    }

    const csvData = parse(diff);
    const correctedCsv = parse(f1);

    const directoryPath = path.join(
      __dirname,
      "../",
      "../",
      "COMPARECSV_FILES",
      "ErrorCsv"
    );
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const CorrectionDirectoryPath = path.join(
      __dirname,
      "../",
      "../",
      "COMPARECSV_FILES",
      "CorrectedCsv"
    );
    if (!fs.existsSync(CorrectionDirectoryPath)) {
      fs.mkdirSync(CorrectionDirectoryPath, { recursive: true });
    }

    const formatDate = (date) => {
      return date.toISOString().replace(/[:.]/g, "-");
    };

    const errorDate = new Date();
    const errorFilePath = path.join(
      directoryPath,
      `error_${formatDate(errorDate)}.csv`
    );
    fs.writeFile(errorFilePath, csvData, (err) => {
      if (err) {
        console.error("Error writing CSV file:", err);
      } else {
        console.log("CSV file saved successfully.");
      }
    });

    const correctionDate = new Date();
    const correctionFilePath = path.join(
      CorrectionDirectoryPath,
      `corrected_${formatDate(correctionDate)}.csv`
    );
    fs.writeFile(correctionFilePath, correctedCsv, (err) => {
      if (err) {
        console.error("Error writing CSV file:", err);
      } else {
        console.log("CSV file saved successfully.");
      }
    });

    res.set("Content-Type", "text/csv");
    res.set("Content-Disposition", 'attachment; filename="data.csv"');

    const groupedArray = groupByPrimaryKey(diff);
    // console.log(f1,"------------------")
    res.status(200).send({
      csvFile: firstFilePath,
      data: groupedArray,
      errorFilePath: errorFilePath,
      correctedFilePath: correctionFilePath,
      imageDirectoryName: zipImageFile,
      file1:f1,
      file2:f2
    });
  } catch (err) {
    res.status(501).send({ error: err.message });
  }
};

module.exports = compareCsv;
  