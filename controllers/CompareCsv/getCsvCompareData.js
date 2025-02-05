const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Assigndata = require("../../models/TempleteModel/assigndata");
const groupByPrimaryKey = require("../../services/groupingCsvData");
const MappedData = require("../../models/TempleteModel/mappedData");
const getAllDirectories = require("../../services/directoryFinder");

function readCSVAndConvertToJSON(filePath) {
  return new Promise((resolve, reject) => {
    const jsonArray = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        jsonArray.push(row);
      })
      .on("end", () => {
        console.log("CSV file successfully processed");
        resolve(jsonArray);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

const getCsvCompareData = async (req, res) => {
  const userPermission = req.permissions;

  const { taskId } = req.params;
  const task = await Assigndata.findOne({ where: { id: taskId } });
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const {
    max,
    min,
    templeteId,
    id,
    errorFilePath,
    correctedCsvFilePath,
    imageDirectoryPath,
    csvFilePath,
  } = task;
  const taskTempleteId = templeteId;
  const minIndex = parseInt(min);
  const maxIndex = parseInt(max);
  const { currentIndex } = req.body;

  if (!maxIndex || !minIndex) {
    return res.status(400).json({ message: "Max and min values are required" });
  }

  if (currentIndex === undefined || currentIndex === null) {
    return res.status(400).json({ message: "Current index is required" });
  }

  if (!(currentIndex >= minIndex && currentIndex <= maxIndex)) {
    return res.status(400).json({ message: "Invalid current index" });
  }

  if (!csvFilePath) {
    return res.status(400).json({ message: "CSV file path is required" });
  }

  try {
    const errorJsonFile = await readCSVAndConvertToJSON(errorFilePath);
    const groupedData = groupByPrimaryKey(errorJsonFile);
    const absoluteFilePath = path.resolve(csvFilePath);

    const results = [];

    const currentTask = await Assigndata.findOne({ where: { id: taskId } });
    if (!currentTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    await currentTask.update({ currentIndex });

    fs.createReadStream(absoluteFilePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        const mappedData = await MappedData.findAll({
          where: {
            templeteId: taskTempleteId,
          },
        });

        const keyValuePair = mappedData.map((item) => ({
          [item.key]: item.value,
        }));
        const mergedObject = keyValuePair.reduce((acc, obj) => {
          const key = Object.keys(obj)[0];
          const value = obj[key];
          acc[key] = value;
          return acc;
        }, {});

        const resultsWithIndex = results.map((result, index) => ({
          ...result,
          rowIndex: minIndex + index,
        }));
        resultsWithIndex.unshift(mergedObject);

        const filteredResults = resultsWithIndex
          .map((result) => {
            const filterValue = groupedData[0].PRIMARY_KEY;
            const matchingGroupedData = groupedData.find(
              (group) => group.PRIMARY === result[filterValue]
            );
            return matchingGroupedData ? { ...result } : null;
          })
          .filter((result) => result !== null);

        let imageFile = path.join(
          __dirname,
          "../",
          "../",
          "extractedFiles",
          imageDirectoryPath
        );

        const imageFolders = getAllDirectories(imageFile);
        imageFolders.forEach((folder) => {
          imageFile = path.join(imageFile, folder);
        });

        // const prefixToRemove ="D:\\Omr\\CSV\\WEB_DATA_CONVERSION_BACKEND_4.0\\extractedFiles";
        // const result = imageFile.replace(prefixToRemove, "");

        const result = imageFile.split("extractedFiles\\")[1];
        res.status(200).json({
          message: "Data found",
          data: {
            previousData: groupedData[currentIndex - 1],
            headers: resultsWithIndex,
            max: maxIndex,
            min: minIndex,
            filteredResults: filteredResults[currentIndex - 1],
            filteredData: filteredResults,
            imageDirectoryPath: result,
          },
        });
      })
      .on("error", (error) => {
        console.error("Error reading CSV file:", error);
        res.status(500).json({ error: "Error reading CSV file" });
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = getCsvCompareData;
