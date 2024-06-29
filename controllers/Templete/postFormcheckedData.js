const FormCheckedData = require("../../models/TempleteModel/formcheckeddata");

const postFormcheckedData = async (req, res) => {
  const { formCheckedData, fileID } = req.body;

  try {
    // Iterate over each key in formCheckedData
    for (const key in formCheckedData) {
      if (formCheckedData.hasOwnProperty(key)) {
        const data = formCheckedData[key];

        // Create a new record for each entry
        await FormCheckedData.create({
          key: key,
          value: data.value,
          legal: data.legal,
          blank: data.blank,
          pattern: data.pattern,
          fileID: fileID,
        });
      }
    }
    // Send a success response
    res.status(201).json({ message: "Form checked data saved successfully" });
  } catch (error) {
    console.error("Error saving form checked data:", error);

    // Send an error response
    res
      .status(500)
      .json({
        message: "Failed to save form checked data",
        error: error.message,
      });
  }
};

module.exports = postFormcheckedData;
