const express = require("express");
const uploadCsv = require("../controllers/CompareCsv/uploadCsv")
const multerUpload = require("../middleware/multerUpload");
const compareCsv = require("../controllers/CompareCsv/compareCsv");
const multipleMulterUpload = require("../middleware/multipleMulterUploads");
const authMiddleware = require("../middleware/authMiddleware");
const { userData, saveData } = require("../controllers/CompareCsv/userCsvData");
const assignTask = require("../controllers/CompareCsv/assignTask");
const assignedTask = require("../controllers/CompareCsv/assignedTask");
const errorFile = require("../controllers/CompareCsv/errorFile");
const submitTask = require("../controllers/CompareCsv/submitTask");
const blank = require("../controllers/CompareCsv/blank");
const { getUploadedFilesByTemplateId } = require("../controllers/CompareCsv/getUploadedFilesByTemplateId");

const router = express.Router();

router.post("/uploadcsv", authMiddleware, multerUpload, uploadCsv);
router.post("/compareData", authMiddleware, multipleMulterUpload, compareCsv)
router.get("/compareAssigned/:taskId", authMiddleware, userData);
router.post("/saveAnswer/:taskId", authMiddleware, saveData);
router.post("/assign", authMiddleware, assignTask);
router.get("/assignedTasks", authMiddleware, assignedTask)
router.get("/download_error_file/:assignId", authMiddleware, errorFile);
router.get("/submitTask/:taskId", authMiddleware, submitTask);
router.post("/mult_error", authMiddleware,multerUpload, blank);
router.post('/getUploadedFiles/:templateId', getUploadedFilesByTemplateId);

module.exports = router;
