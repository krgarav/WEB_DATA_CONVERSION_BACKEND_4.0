const Files = require("../../models/TempleteModel/files");

const getUploadedFilesByTemplateId = async (req, res) => {
  const { templateId } = req.params;

  try {
    // Fetch files associated with the given template ID from the database
    const files = await Files.findAll({
      where: { templeteId: templateId },
    });

    if (!files || files.length === 0) {
      return res
        .status(404)
        .json({ message: "No files found for the given template ID" });
    }

    // Remove the .zip extension from the zip file paths
    const modifiedFiles = files.map((file) => {
      const { zipFile, ...rest } = file.dataValues;
      return {
        ...rest,
        zipFile: zipFile.replace(/\.zip$/, ""),
      };
    });

    // Return the modified files' information
    res.status(200).json(modifiedFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUploadedFilesByTemplateId,
};
  