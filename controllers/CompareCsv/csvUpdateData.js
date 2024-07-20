const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Assigndata = require("../../models/TempleteModel/assigndata");

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

function writeJSONToCSV(filePath, jsonArray) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    writeStream.write("PRIMARY,COLUMN_NAME,FILE_1_DATA,FILE_2_DATA,IMAGE_NAME,CORRECTED,CORRECTED BY,PRIMARY KEY\n");
    jsonArray.forEach(row => {
      writeStream.write(
        `${row.PRIMARY},${row.COLUMN_NAME},${row.FILE_1_DATA},${row.FILE_2_DATA},${row.IMAGE_NAME},${row.CORRECTED},${row['CORRECTED BY']},${row['PRIMARY KEY']}\n`
      );
    });
    writeStream.end();
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

const csvUpdateData = async (req, res) => {
  try {
    const { userName, email } = req.user;

    const { taskId } = req.params;
    const updates = req.body; // Expecting an array of updates

    const task = await Assigndata.findOne({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { errorFilePath } = task;
    const resolvedErrorFilePath = path.resolve(errorFilePath);

    if (!fs.existsSync(resolvedErrorFilePath)) {
      return res.status(400).json({ message: "Error file not found" });
    }

    const errorJsonFile = await readCSVAndConvertToJSON(resolvedErrorFilePath);

    // Process each update in the request body
    const updatedErrorJsonFile = errorJsonFile.map(item => {
      updates.forEach(update => {
        const { PRIMARY, COLUMN_NAME, CORRECTED } = update;
        if (item.PRIMARY.trim() === PRIMARY.trim() && item.COLUMN_NAME.trim() === COLUMN_NAME.trim()) {
          item.CORRECTED = CORRECTED; // Update CORRECTED value

          // Save email in CORRECTED BY column
          item['CORRECTED BY'] = email;
        }
      });
      return item;
    });

    // Write the updated JSON back to CSV
    await writeJSONToCSV(resolvedErrorFilePath, updatedErrorJsonFile);

    return res.status(200).json({ message: "Task updated successfully", updatedErrorJsonFile });

  } catch (error) {
    console.error("Error in csvUpdateData:", error);
    return res.status(500).json({ message: "An error occurred while updating the task" });
  }
};


module.exports = csvUpdateData;


