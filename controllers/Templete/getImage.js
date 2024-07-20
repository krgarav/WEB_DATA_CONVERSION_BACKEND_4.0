const fs = require("fs").promises;
const path = require("path");
const Assigndata = require("../../models/TempleteModel/assigndata");
const RowIndexData = require("../../models/TempleteModel/rowIndexData");

const getImage = async (req, res, next) => {
  const userPermission = req.permissions;
  if (userPermission.dataEntry !== true) {
    return res.status(500).json({ message: "User not authorized" });
  }

  try {
    const { imageNameArray, id, rowIndex } = req.body;
    // console.log(imageNameArray, id, rowIndex);
    if (
      !imageNameArray ||
      !Array.isArray(imageNameArray) ||
      imageNameArray.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "ImageNameArray is missing or empty" });
    }

    const assigndataInstance = await Assigndata.findOne({
      where: { id: id },
    });

    if (!assigndataInstance) {
      return res.status(400).json({ error: "CurrentIndex mismatched with ID" });
    }

    assigndataInstance.currentIndex = rowIndex;
    assigndataInstance.save();

    const arrayOfImages = [];

    for (const imageName of imageNameArray) {
      if (!imageName) {
        return res.status(400).json({ error: "ImageName is missing" });
      }

      const sourceFilePath = path.join(
        __dirname,
        "..",
        "..",
        "extractedFiles",
        imageName
      );
      // console.log(sourceFilePath, "------");
      try {
        await fs.access(sourceFilePath); // Check if the file exists

        const image = await fs.readFile(sourceFilePath); // Read the file
        const base64Image = image.toString("base64"); // Convert to Base64

        arrayOfImages.push({ base64Image });
      } catch (error) {
        // If the file doesn't exist or any other error occurs, handle it
        return res.status(404).json({ error: `File not found: ${imageName}` });
      }
    }

    res.status(200).json({ arrayOfImages });
  } catch (err) {
    // Handle errors
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = getImage;
