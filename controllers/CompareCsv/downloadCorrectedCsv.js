const path = require("path");
const fs = require("fs").promises; // Use the promises API for async/await
const Assigndata = require("../../models/TempleteModel/assigndata");
const Files = require("../../models/TempleteModel/files");
const csvToJson = require("../../services/csv_to_json");
const jsonToCsv = require("../../services/json_to_csv");

const DownloadCorrectedCsv = async (req, res) => {
  const userRole = req.role;
  console.log(userRole);
  if (userRole !== "Admin") {
    return res
      .status(403)
      .json({ message: "You don't have access to perform this action" });
  }

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
    const originalFilePath = path.join(
      __dirname,
      "../../csvFile",
      originalFilename
    );

    try {
      await fs.access(originalFilePath); // Check if the file exists
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

      console.log(`Searching for primary key'${primary}' in jsonData with key '${primaryKey}'`);

      // Find the corresponding row in jsonData
      let findVar = jsonData.find(
        (item) => item[primaryKey] == primary.trim()
      );

      if (findVar) {
        findVar[columnName] = correctedValue;
        console.log(`Updated row:`, findVar);
      } else {
        console.log(`No matching row found for primary key '${primary},${primaryKey}'`);
      }
    });

    // Convert the updated JSON data back to CSV
    const updatedCsv = await jsonToCsv(jsonData);

    // Write the updated CSV to the corrected file path
    await fs.writeFile(correctedCsvFilePath, updatedCsv);

    return res
      .status(200)
      .json({ message: "CSV file corrected and saved successfully" });
  } catch (error) {
    console.error("Error downloading CSV file:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
};

module.exports = DownloadCorrectedCsv;
