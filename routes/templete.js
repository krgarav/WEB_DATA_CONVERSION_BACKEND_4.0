const express = require("express");
const addOrUpdateTemplate = require("../controllers/Templete/addOrUpdateTemplate");
const getTemplete = require("../controllers/Templete/getTemplete");
const getTempleteData = require("../controllers/Templete/getTempleteData");
const handleUpload = require("../controllers/Templete/upload");
const getHeaderData = require("../controllers/Templete/getHeaderData");
const handleData = require("../controllers/Templete/handleData");
const getCsvData = require("../controllers/Templete/getCsvData");
const getImage = require("../controllers/Templete/getImage");
const updateCsvData = require("../controllers/Templete/updateCsvData");
const assignUser = require("../controllers/Templete/assignUser");
const getAllTask = require("../controllers/Templete/getAllTask");
const getTask = require("../controllers/Templete/getTask");
const taskUpdation = require("../controllers/Templete/taskUpdation");
const authMiddleware = require("../middleware/authMiddleware");
const duplicateFinder = require("../controllers/Templete/duplicateFinder");
const deleteDuplicateData = require("../controllers/Templete/deleteDuplicateData");
const editDuplicateData = require("../controllers/Templete/editDuplicateData");
const downloadCsv = require("../controllers/Templete/downloadCsv");
const editTemplateData = require("../controllers/Templete/editTemplateData");
const deleteTemplate = require("../controllers/Templete/deleteTemplate");
const updatedDetails = require("../controllers/Templete/updatedDetails");
const userDetails = require("../controllers/Templete/userDetails");
const editAssignedTask = require("../controllers/Templete/editAssignedTask");
const getMappedData = require("../controllers/Templete/getMappedData");
const postFormCheckedData = require("../controllers/Templete/postFormcheckedData");
const getFormCheckedData = require("../controllers/Templete/getFormCheckedData");
const router = express.Router();

router.get("/get/templetedata/:id", authMiddleware, getTempleteData); //templeteId
router.get("/get/headerdata/:id", authMiddleware, getHeaderData); //fileId
router.get("/get/alltasks", authMiddleware, getAllTask); //admin
router.get("/get/task/:id", authMiddleware, getTask); //user
router.get("/download/csv/:id", downloadCsv); //file Id
router.get("/user/details/:id", userDetails); //userId
router.get("/get/mappeddata/:id", getMappedData); //templateId
router.get("/formcheckeddata", authMiddleware, getFormCheckedData); //fileId

router.post("/updated/details", authMiddleware, updatedDetails); //userId
router.post("/edit/template/:id", authMiddleware, editTemplateData); //template Id
router.post("/get/templetes", authMiddleware, getTemplete);
router.post("/get/csvdata", authMiddleware, getCsvData);
router.post("/get/image", authMiddleware, getImage);
router.post("/add/templete", authMiddleware, addOrUpdateTemplate);
router.post("/upload/:id", authMiddleware, handleUpload); //templeteId
router.post("/data", authMiddleware, handleData);
router.post("/updatecsvdata/:id", authMiddleware, updateCsvData); //fileId
router.post("/assign/user", authMiddleware, assignUser);
router.post("/taskupdation/:id", authMiddleware, taskUpdation); //assigndata Id
router.post("/duplicate/data", authMiddleware, duplicateFinder);
router.post("/delete/duplicate", authMiddleware, deleteDuplicateData);
router.post("/update/duplicatedata", authMiddleware, editDuplicateData);
router.post("/delete/template/:id", authMiddleware, deleteTemplate); //templateId
router.post("/edit/assigned/task", authMiddleware, editAssignedTask); //assignedTaskId //userId
router.post("/formcheckeddata", authMiddleware, postFormCheckedData); //fileId

module.exports = router;
