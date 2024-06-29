const Files = require("../../models/TempleteModel/files");
const path = require("path");
const fs = require("fs").promises; // Use the promises API for async/await
const csvToJson = require("../../services/csv_to_json");
const jsonToCsv = require("../../services/json_to_csv");

const downloadCsv = async (req, res) => {

  try {
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(400).json({ error: "File ID not provided" });
    }

    const fileData = await Files.findOne({
      where: { id: fileId },
    });

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

    // Remove the first row
    jsonData.shift();

    // Columns to remove
    const columnsToRemove = [
      "User Details",
      "Previous Values",
      "Updated Values",
      "Updated Col. Name",
    ];

    // Filter out the specified columns
    const filteredJsonData = jsonData.map((row) => {
      columnsToRemove.forEach((col) => {
        delete row[col];
      });
      return row;
    });

    // Convert filtered JSON data back to CSV
    const csvData = jsonToCsv(filteredJsonData);

    // Create a filename with the current date and time
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
    const copiedFilename = `copy-${timestamp}.csv`;
    const copiedFilePath = path.join(
      __dirname,
      "../../csvFile",
      copiedFilename
    );

    await fs.writeFile(copiedFilePath, csvData, { encoding: "utf8" });

    // Send the copied file to the client for download
    return res.download(copiedFilePath, copiedFilename, async (err) => {
      if (err) {
        console.error("Error sending file:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while processing your request" });
      }

      // Optionally, delete the copied file after sending it to the client
      try {
        await fs.unlink(copiedFilePath);
      } catch (unlinkErr) {
        console.error("Error deleting temporary file:", unlinkErr);
      }
    });
  } catch (error) {
    console.error("Error downloading CSV file:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
};

module.exports = downloadCsv;
