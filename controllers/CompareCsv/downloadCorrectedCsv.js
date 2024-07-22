const path = require("path");
const fs = require("fs").promises;
const Assigndata = require("../../models/TempleteModel/assigndata");
const Files = require("../../models/TempleteModel/files");
const csvToJson = require("../../services/csv_to_json");
const jsonToCsv = require("../../services/json_to_csv");

const DownloadCorrectedCsv = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Assigndata.findOne({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { errorFilePath, correctedCsvFilePath, fileId } = task;

    if (!fileId) {
      return res.status(400).json({ error: "fileId not found" });
    }
    if (!errorFilePath || !correctedCsvFilePath) {
      return res.status(400).json({ error: "FilePath not provided" });
    }

    const fileData = await Files.findOne({ where: { id: fileId } });
    if (!fileData) {
      return res.status(404).json({ error: "File not found" });
    }

    const originalFilename = fileData.csvFile;
    const originalFilePath = path.join(__dirname, "../../csvFile", originalFilename);

    try {
      await fs.access(originalFilePath);
    } catch (err) {
      return res.status(404).json({ error: "File not found" });
    }

    const jsonData = await csvToJson(originalFilePath);
    const errorData = await csvToJson(errorFilePath);

    errorData.forEach((errorRow) => {
      const primaryKey = errorRow["PRIMARY KEY"];
      const primary = errorRow["PRIMARY"];
      const columnName = errorRow["COLUMN_NAME"];
      const correctedValue = errorRow["CORRECTED"];

      let findVar = jsonData.find((item) => item[primaryKey] == primary.trim());

      if (findVar) {
        findVar[columnName] = correctedValue;
      } else {
        console.log(`No matching row found for primary key '${primary},${primaryKey}'`);
      }
    });

    const updatedCsv = await jsonToCsv(jsonData);
    await fs.writeFile(correctedCsvFilePath, updatedCsv);

    // Set original filename in the response header
    res.setHeader('X-Original-Filename', originalFilename);

    // Send the file as an attachment
    res.download(correctedCsvFilePath, 'corrected_file.csv', (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({ error: "An error occurred while sending the file" });
      }
    });
  } catch (error) {
    console.error("Error processing CSV file:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
};

module.exports = DownloadCorrectedCsv;
