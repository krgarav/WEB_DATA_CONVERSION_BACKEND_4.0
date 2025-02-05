const path = require("path");
const fs = require("fs").promises; // Use the promises API for async/await
const Assigndata = require("../../models/TempleteModel/assigndata");

const downloadErrorCorrectedFile = async (req, res) => {
  const userRole = req.role;
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

    const { errorFilePath } = task;

    if (!errorFilePath) {
      return res.status(404).json({ message: "Error file path not found" });
    }

    // Extract the base filename without timestamp
    const fileNameWithTimestamp = path.basename(errorFilePath);
    const fileName = fileNameWithTimestamp.replace(/_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/, '');

    // Read the file
    const fileData = await fs.readFile(errorFilePath);

    // Send the file data as a stream
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(fileData); // Send the file data directly as binary

  } catch (error) {
    console.error("Error downloading file:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
};

module.exports = downloadErrorCorrectedFile;
