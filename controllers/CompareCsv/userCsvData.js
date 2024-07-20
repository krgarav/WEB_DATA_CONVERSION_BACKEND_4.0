const Assigndata = require("../../models/TempleteModel/assigndata");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const { Parser } = require('json2csv');
const getAllDirectories = require("../../services/directoryFinder")
const groupByPrimaryKey = require("../../services/groupingCsvData")


function convertJSONToCSV(jsonData) {
  try {
    const parser = new Parser();
    const csvData = parser.parse(jsonData);
    return csvData;
  } catch (error) {
    console.error('Error converting JSON to CSV:', error);
    return null;
  }
}

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

exports.userData = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const task = await Assigndata.findOne({ where: { id: taskId } });
    
    const {
      max,
      min,
      errorFilePath,
      correctedCsvFilePath,
      imageDirectoryPath,
      currentIndex,
    } = task;
    const { currindex } = req.headers;

    const errorJsonFile = await readCSVAndConvertToJSON(errorFilePath);
    const sendFile = errorJsonFile[currindex - 1];
    const imageName = sendFile.IMAGE_NAME;
    
    let imagePath = path.join(__dirname, "../", "../", "extractedFiles", imageDirectoryPath);
    const imageFolders = getAllDirectories(imagePath);

    imageFolders.forEach(folder => {
      imagePath = path.join(imagePath, folder);
    });

    const image = path.join(imagePath, imageName);

    fs.readFile(image, { encoding: "base64" }, (err, data) => {
      if (err) {
        console.error("Error reading image:", err);
        return res.status(500).send({ message: "Error reading image" });
      }

      const base64URL = `data:image/jpeg;base64,${data}`;

      // Group data by primary key
      const groupedData = groupByPrimaryKey(errorJsonFile);
      // console.log(groupedData,"groupdata")
      res.status(201).send({
        message: "Task found successfully",
        data: sendFile,
        currentIndex: currentIndex,
        imageURL: base64URL,
        min: min,
        max: max,
        // csvFile: csvFile,
        groupedData: groupedData  , // Include grouped data in response
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
};
exports.saveData = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { column_name, corrected_value, currentIndexValue } = req.body;
    const task = await Assigndata.findOne({ where: { id: taskId } });

    if (task) { 
      const { errorFilePath, correctedCsvFilePath, primary_key, currentIndex } =
        task;
      task.currentIndex = +currentIndexValue;
      await task.save();
      const name = req.user.userName;
      // Parse CSV content to JSON
      const errorJsonFile = await readCSVAndConvertToJSON(errorFilePath);
      const errorFile = errorJsonFile[currentIndexValue - 1];
      errorFile["CORRECTED BY"] = name;
      const parsedFile = JSON.parse(errorFile.CORRECTED)
      if (parsedFile.length === 0) {
        parsedFile.push({ [column_name]: corrected_value });
      } else {
        let found = false;
        for (let i = 0; i < parsedFile.length; i++) {
          for (let [key, value] of Object.entries(parsedFile[i])) {
            if (key === column_name) {
              parsedFile[i][key] = corrected_value;
              found = true; // Mark that a match was found
              break; // No need to continue loop if match is found
            }
          }
        }

        // If no matching key is found, add a new object
        if (!found) {
          parsedFile.push({ [column_name]: corrected_value });
        }
      }

      // const updatedCorrectedFile = parsedFile.


      // console.log(typeof parsedFile)
      // parsedFile.push({ [column_name]: corrected_value });
      errorFile.CORRECTED = JSON.stringify(parsedFile);
      // Convert JSON back to CSV format
      const updatedCSVContent = convertJSONToCSV(errorJsonFile);

      // Write the updated content back to the original file
      fs.writeFileSync(errorFilePath, updatedCSVContent, { encoding: 'utf8' });

      // // Read and update corrected CSV file
      // let correctedCsvJsonFile = await fs.readFileSync(correctedCsvFilePath, { encoding: 'utf8' });
      // correctedCsvJsonFile = readCSVAndConvertToJSON(correctedCsvJsonFile);

      // for (let i = 0; i < correctedCsvJsonFile.length; i++) {
      //   if (correctedCsvJsonFile[i][primary_key] === taskId) {
      //     correctedCsvJsonFile[i][column_name] = corrected_value;
      //     correctedCsvJsonFile[i].CORRECTED_BY = 'GAURAV';
      //     correctedCsvJsonFile[i]['CORRECTION COLUMN'] = [column_name];
      //     break;
      //   }
      // }

      // // Convert JSON back to CSV format
      // const updatedCorrectedCSVContent = convertJSONToCSV(correctedCsvJsonFile);
      // await fs.writeFileSync(correctedCsvFilePath, updatedCorrectedCSVContent, { encoding: 'utf8' });

      // // Respond with success message
      res.status(200).json({ message: 'saved updated successfully' });
    } else {
      throw new Error("Task not found.")
    }
  } catch (err) {
    // console.log(err);
    res.status(500).send({ message: "Error occured : ", err })
  }
};

// module.exports = userData;
