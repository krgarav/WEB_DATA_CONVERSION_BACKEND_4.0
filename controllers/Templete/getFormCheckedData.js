const FormCheckedData = require("../../models/TempleteModel/formcheckeddata");

const getFormCheckedData = async (req, res) => {
  const fileID = req.params.id;

  try {
    // Check if fileID is provided and is a valid format
    if (!fileID) {
      return res.status(400).json({ message: "fileID is required" });
    }

    // Fetch form checked data based on fileID
    const formCheckedData = await FormCheckedData.findAll({
      where: { fileID: fileID },
    });

    // Check if data is found
    if (formCheckedData.length === 0) {
      return res
        .status(404)
        .json({ message: "No form checked data found for the given fileID" });
    }

    // Send the retrieved data as a response
    res.status(200).json(formCheckedData);
  } catch (error) {
    console.error("Error fetching form checked data:", error);

    // Send an error response
    res
      .status(500)
      .json({
        message: "Failed to fetch form checked data",
        error: error.message,
      });
  }
};

module.exports = getFormCheckedData;
