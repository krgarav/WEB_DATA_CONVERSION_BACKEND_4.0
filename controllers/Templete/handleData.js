const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const Files = require("../../models/TempleteModel/files");
const MappedData = require("../../models/TempleteModel/mappedData");
const jsonToCsv = require("../../services/json_to_csv");
const csvToJson = require("../../services/csv_to_json");

const handleData = async (req, res, next) => {
  const userRole = req.role;
  if (userRole !== "Admin") {
    return res
      .status(500)
      .json({ message: "You don't have access for performing this action" });
  }
  const { mappedData } = req.body;

  try {
    if (!mappedData.fileId) {
      return res.status(400).json({ error: "File not provided" });
    }

    const fileData = await Files.findOne({ where: { id: mappedData.fileId } });
    if (!fileData) {
      return res.status(404).json({ error: "File not exists" });
    }
    if (!fileData.csvFile) {
      return res.status(404).json({ error: "File not exists" });
    }

    const filename = fileData.csvFile;
    const filePath = path.join(__dirname, "../../csvFile", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: "",
    });

    // Fetch mapped data entries for the given template ID
    const mappedDataValues = await MappedData.findAll({
      where: { templeteId: fileData.templeteId },
    });

    // Log existing mapped data entries
    // console.log("Existing mapped data entries:", mappedDataValues);

    // Remove mapped data entries if they exist
    if (mappedDataValues && mappedDataValues.length > 0) {
      await MappedData.destroy({
        where: { templeteId: fileData.templeteId },
      });
    }

    // Remove fileId from mappedData and transform associationData back to key-value object
    const associationDataArray = mappedData.associationData;
    const associationData = associationDataArray.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    // Log association data to be saved
    // console.log("Association data to be saved:", associationData);

    // Save association data to MappedData model
    await Promise.all(
      Object.keys(associationData).map(async (key) => {
        await MappedData.create({
          key: key,
          value: associationData[key],
          templeteId: fileData.templeteId,
        });
      })
    );

    // Fetch mapped data entries again to verify saving
    const savedMappedDataValues = await MappedData.findAll({
      where: { templeteId: fileData.templeteId },
    });
    // Log saved mapped data entries
    // console.log("Saved mapped data entries:", savedMappedDataValues);

    // Add the associationData as the first row in the data array
    data.unshift(associationData);
    const csvData = jsonToCsv(data);

    fs.unlinkSync(filePath);
    fs.writeFileSync(filePath, csvData, {
      encoding: "utf8",
    });

    res.status(200).json("Header added successfully");
  } catch (error) {
    console.error("Error handling data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = handleData;
