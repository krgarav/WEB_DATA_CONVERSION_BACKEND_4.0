const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const Files = require("../../models/TempleteModel/files");
const Templete = require("../../models/TempleteModel/templete");
const FormCheckedData = require("../../models/TempleteModel/formcheckeddata");
const MetaData = require("../../models/TempleteModel/metadata");
const { Op } = require("sequelize");

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getCsvData = async (req, res, next) => {
  try {
    const fileId = req.body?.taskData?.fileId;

    if (!fileId) {
      return res.status(400).json({ error: "File ID not provided" });
    }

    // Fetch file data
    const fileData = await Files.findOne({
      where: { id: fileId },
      include: [
        { model: Templete, attributes: ["pageCount", "patternDefinition"] },
      ],
    });

    if (!fileData) {
      return res.status(404).json({ error: "File not found" });
    }

    const filename = fileData.csvFile;
    const filePath = path.join(__dirname, "../../csvFile", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "CSV file not found" });
    }

    // Read and parse CSV file
    let workbook, worksheet;
    try {
      workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[sheetName];
    } catch (readError) {
      console.error("Error reading CSV file:", readError);
      return res.status(500).json({ error: "Error reading CSV file" });
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    const { min, max } = req.body.taskData || {};
    const minIndex = parseInt(min);
    const maxIndex = parseInt(max);

    // Validate min and max indices
    if (
      isNaN(minIndex) ||
      isNaN(maxIndex) ||
      minIndex < 0 ||
      minIndex >= jsonData.length ||
      maxIndex < 0 ||
      maxIndex >= jsonData.length ||
      maxIndex < minIndex
    ) {
      return res.status(400).json({ error: "Invalid min or max value" });
    }

    // Determine image column keys
    const imageColNameFinder = Object.values(jsonData[0]);
    let imageColNameContainer = [];
    let count = 1;

    while (true) {
      const imageName = `Image${count}`;
      if (imageColNameFinder.includes(imageName)) {
        imageColNameContainer.push(imageName);
        count++;
      } else {
        break;
      }
    }

    // Find keys for the values in imgageColNameContainer
    let imageColKeyContainer = [];

    imageColNameContainer.forEach((imageName) => {
      for (const [key, value] of Object.entries(jsonData[0])) {
        if (value === imageName) {
          imageColKeyContainer.push(key);
          break;
        }
      }
    });

    const patternDefinition = fileData.templete.patternDefinition;
    const blankDefination = fileData.templete.blankDefination;

    const legalCheckData = await MetaData.findAll({
      where: {
        [Op.and]: [
          { templeteId: fileData.templeteId },
          { fieldType: "formField" },
        ],
      },
    });

    const resultLegalData = legalCheckData.map((item) => ({
      attribute: item.attribute,
      dataFieldType: item.dataFieldType,
      fieldRange: item.fieldRange,
      fieldLength: item.fieldLength,
    }));

    let definedPattern;

    try {
      definedPattern = new RegExp(escapeRegExp(patternDefinition));
    } catch (e) {
      console.error("Invalid regular expression pattern:", e);
      return res
        .status(400)
        .json({ error: "Invalid pattern definition in database" });
    }

    // Compile conditions from form checked data
    const colConditions = await FormCheckedData.findAll({
      where: { fileID: fileId },
    });

    const colConditionsKeyValue = await FormCheckedData.findAll({
      where: { fileID: fileId },
      attributes: ["key", "value"],
    });

    // Map key and value pairs
    const keyValuePairArray = colConditionsKeyValue.map(({ key, value }) => ({
      csvHeaderkey: key,
      userKey: value,
    }));

    // Function to check conditions
    const conditionFunc = (obj, legal, blank, pattern) => {
      const isBlank = (value) => value === blankDefination;

      const matchesPattern = (value) => definedPattern.test(value);

      const checkNumberRange = (value, range) => {
        if (!value || isNaN(value)) return false;
        const [min, max] = range.split("--").map(Number);
        const numValue = Number(value);
        return numValue >= min && numValue <= max;
      };

      const checkFieldLength = (value, length) => {
        if (!value) return false;
        if (typeof value !== "string") value = String(value);
        return value.length <= Number(length);
      };

      for (const key in obj) {
        if (key === imageColKeyContainer[imageColKeyContainer.length - 1]) {
          break; // Stop at the last key in imageColKeyContainer
        }

        const value = obj[key];

        if (blank && isBlank(value)) {
          return true;
        }

        if (pattern && matchesPattern(value)) {
          return true;
        }

        if (legal) {
          const matchingPair = keyValuePairArray.find(
            (pair) => pair.userKey === key
          );

          if (matchingPair) {
            const { csvHeaderkey } = matchingPair;
            const attributeInfo = resultLegalData.find(
              (item) => item.attribute === csvHeaderkey
            );

            if (attributeInfo) {
              const { dataFieldType, fieldRange, fieldLength } = attributeInfo;

              if (dataFieldType === "number") {
                if (!checkNumberRange(value, fieldRange)) {
                  return true;
                }
                if (!checkFieldLength(value, fieldLength)) {
                  return true;
                }
              } else if (dataFieldType === "text") {
                if (!checkFieldLength(value, fieldLength)) {
                  return true;
                }
              }
            }
          }
        }
      }
      return false;
    };

    // Filter data based on conditions
    const filteredData = [];
    const minToMaxData = jsonData.slice(minIndex, maxIndex + 1);

    minToMaxData.forEach((obj, index) => {
      const conditions = colConditions[index];

      if (
        conditions &&
        conditionFunc(
          obj,
          conditions.legal,
          conditions.blank,
          conditions.pattern
        )
      ) {
        filteredData.push({ ...obj, rowIndex: minIndex + index });
      }
    });

    // Return filtered data with header row
    filteredData.unshift(jsonData[0]);
    res.status(200).json(filteredData);
  } catch (error) {
    console.error("Error handling data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = getCsvData;
