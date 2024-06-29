const Templete = require("../../models/TempleteModel/templete");
const MetaData = require("../../models/TempleteModel/metadata");
const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
const ImageData = require("../../models/TempleteModel/templeteImages");

const baseFolder = path.join(__dirname, "../../TempleteImages");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    if (!(await fs.access(baseFolder).catch(() => false))) {
      await fs.mkdir(baseFolder, { recursive: true });
    }
    cb(null, baseFolder);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/tiff"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PNG, JPEG, and TIF files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
}).array("images", 10);

const uploadPromise = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        return res
          .status(400)
          .json({ message: "Invalid request: " + err.message });
      } else if (err) {
        console.error("Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      resolve();
    });
  });
};

const addOrUpdateTemplate = async (req, res) => {
  const userRole = req.role;
  // console.log(userRole, "-----------");
  if (userRole != "Admin") {
    return res
      .status(500)
      .json({ message: "You don't have access for performing this action" });
  }

  try {
    await uploadPromise(req, res);

    if (!req.body.data) {
      throw new Error("No data provided");
    }

    const { templateData, metaData, templateId } = JSON.parse(req.body.data);

    if (!templateData || !templateData.name || !templateData.pageCount) {
      return res
        .status(400)
        .json({ message: "Template name and page count are required" });
    }

    if (!Array.isArray(metaData) || metaData.length === 0) {
      return res
        .status(400)
        .json({ message: "Meta data is required and should be an array" });
    }

    let template;
    if (templateId) {
      template = await Templete.findByPk(templateId, {
        include: [ImageData, MetaData],
      });

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Update the template
      await template.update({
        name: templateData.name,
        pageCount: templateData.pageCount,
        typeOption: templateData.typeOption,
        patternDefinition: templateData.patternDefinition,
        blankDefination: templateData.blankDefination,
        isPermittedToEdit: templateData.isPermittedToEdit,
      });

      // Delete existing metadata and images
      await MetaData.destroy({ where: { templeteId: template.id } });
      await ImageData.destroy({ where: { templeteId: template.id } });
    } else if (templateId === undefined) {
      // Create a new template
      template = await Templete.create({
        name: templateData.name,
        TempleteType: "Data Entry",
        pageCount: templateData.pageCount,
        typeOption: templateData.typeOption,
        patternDefinition: templateData.patternDefinition,
        blankDefination: templateData.blankDefination,
        isPermittedToEdit: templateData.isPermittedToEdit,
      });
    }

    // Add new metadata
    await Promise.all(
      metaData.map((current) => {
        return MetaData.create({
          ...current,
          templeteId: template.id,
        });
      })
    );

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images were uploaded" });
    }

    // Add new image paths
    const imagePaths = req.files.map((file) => ({
      imagePath: file.filename,
      templeteId: template.id,
    }));
    await ImageData.bulkCreate(imagePaths);

    res.status(200).json({ message: "Created or Updated Successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = addOrUpdateTemplate;
