const express = require("express");
const uploadCsv = require("../controllers/CompareCsv/uploadCsv")
const multerUpload = require("../middleware/multerUpload");
const compareCsv = require("../controllers/CompareCsv/compareCsv");
const multipleMulterUpload = require("../middleware/multipleMulterUploads");
const authMiddleware = require("../middleware/authMiddleware");
const { userData, saveData } = require("../controllers/CompareCsv/userCsvData");
const assignTask = require("../controllers/CompareCsv/assignTask");
const csvUpdateData = require("../controllers/CompareCsv/csvUpdateData");
const getCompareCsvData = require("../controllers/CompareCsv/getCsvCompareData");
const assignedTask = require("../controllers/CompareCsv/assignedTask");
const errorFile = require("../controllers/CompareCsv/errorFile");
const submitTask = require("../controllers/CompareCsv/submitTask");
const blank = require("../controllers/CompareCsv/blank");
const { getUploadedFilesByTemplateId } = require("../controllers/CompareCsv/getUploadedFilesByTemplateId");
const downloadCorrectedCsv = require("../controllers/CompareCsv/downloadCorrectedCsv");
const downlaodErrorCorrectedFile = require("../controllers/CompareCsv/downlaodErrorCorrectedFile");

const router = express.Router();

router.post("/uploadcsv", authMiddleware, multerUpload, uploadCsv);
router.post("/compareData", authMiddleware, multipleMulterUpload, compareCsv)
router.get("/compareAssigned/:taskId", authMiddleware, userData);
router.get("/download/correctedCsv/:taskId",authMiddleware, downloadCorrectedCsv); 
router.get("/download/errorCorrectedCsv/:taskId",authMiddleware, downlaodErrorCorrectedFile); 
router.post("/saveAnswer/:taskId", authMiddleware, saveData);
router.post("/assign", authMiddleware, assignTask);
router.post("/getCompareCsvData/:taskId", authMiddleware, getCompareCsvData);
router.post("/csvUpdateData/:taskId/batch", authMiddleware, csvUpdateData);
router.get("/assignedTasks", authMiddleware, assignedTask)
router.get("/download_error_file/:assignId", authMiddleware, errorFile);
router.get("/submitTask/:taskId", authMiddleware, submitTask);
router.post("/mult_error", authMiddleware,multerUpload, blank);
router.post('/getUploadedFiles/:templateId', getUploadedFilesByTemplateId);

module.exports = router;
