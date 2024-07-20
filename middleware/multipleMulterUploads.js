const multer = require("multer");
const fs = require("fs");
const path = require("path");
const unzipper = require('unzipper');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let destinationFolder = "COMPARECSV_FILES/" + "multipleCsvCompare";
        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder, { recursive: true });
        }
        cb(null, destinationFolder); // Destination folder
    },
    filename: function (req, file, cb) {

        cb(null, file.originalname); // Use original filename
    },
});

// Set up multer storage
const upload = multer({
    storage: storage,
    limits: undefined
}).fields([
    { name: "firstInputCsvFile", maxCount: 1 },
    // { name: "secondInputCsvFile", maxCount: 1 },
    // { name: 'zipImageFile', maxCount: 1 }
]);
const uploadCsv = async (req, res, next) => {
    const userPermissions = req.permissions

    if (!userPermissions.comparecsv) {
        return res.status(500).json({ message: "you dont have access for performing this action" })
    }

    upload(req, res, async (err) => {
        const formatDate = (date) => {
            return date.toISOString().replace(/[:.]/g, '-'); // Replace colons and periods with dashes
        };
        if (err) {
            // Multer error occurred
            console.error("Multer error:", err);
            return res.status(400).json({ error: "Failed to upload file" });
        }

        // Access uploaded files using req.files
        const firstInputCsvFile = req.files["firstInputCsvFile"] ? req.files["firstInputCsvFile"][0] : null;
        // const secondInputCsvFile = req.files["secondInputCsvFile"] ? req.files["secondInputCsvFile"][0] : null;
        // const zipImageFile = req.files["zipImageFile"] ? req.files["zipImageFile"][0] : null;
        // const zipfileName = zipImageFile.originalname;

        // const uploadDate = new Date();
        // const omrImagesZipDir = path.join(__dirname, "..", "extractedFiles", `${FormData(zipImageFile)}`);
        // console.log(omrImagesZipDir,"omrImages")
        
        // const omrImages = path.join(__dirname, "../");
        // console.log(omrImages,"omrImages")
        // if (!fs.existsSync(omrImagesZipDir)) {
        //     fs.mkdirSync(omrImagesZipDir, { recursive: true });
        // }
        // if (!fs.existsSync(omrImages)) {
        //     fs.mkdirSync(omrImages, { recursive: true });
        // }

        // // Function to extract the uploaded zip file
        // const extractZipFile = (zipFilePath) => {
        //     return new Promise((resolve, reject) => {
        //         fs.createReadStream(zipFilePath)
        //             .pipe(unzipper.Extract({ path: omrImages }))
        //             .on('close', () => {
        //                 console.log('Zip file extracted successfully.');
        //                 resolve();
        //             })
        //             .on('error', (error) => {
        //                 console.error('Error extracting zip file:', error);
        //                 reject(error);
        //             });
        //     });
        // };
        const extractZipFile = (zipFilePath) => {
            return new Promise((resolve, reject) => {
                fs.createReadStream(zipFilePath)
                    .pipe(unzipper.Parse())
                    .on('entry', (entry) => {
                        const fileName = entry.path;
                        const destinationPath = path.join(omrImages, path.basename(fileName));

                        if (entry.type === 'File') {
                            entry.pipe(fs.createWriteStream(destinationPath));
                        } else if (entry.type === 'Directory') {
                            fs.mkdirSync(destinationPath, { recursive: true });
                        }
                    })
                    .on('error', (error) => {
                        console.error('Error extracting zip file:', error);
                        reject(error);
                    })
                    .on('close', () => {
                        console.log('Zip file extracted successfully.');
                        resolve();
                    });
            });
        };

        // if (zipImageFile) {

        //     // const destinationPath = path.join(omrImagesZipDir, zipfileName);
        //     const destinationPath = path.join(omrImagesZipDir);
        //     // Create a read stream for the uploaded file
        //     const readStream = fs.createReadStream(zipImageFile.path);

        //     // Create a write stream to save the zip image file
        //     const writeStream = fs.createWriteStream(destinationPath);

        //     // Pipe the read stream (uploaded file) to the write stream
        //     readStream.pipe(writeStream);

        //     // Listen for the 'finish' event to know when the file write is complete
        //     writeStream.on('finish', async () => {
        //         console.log('Zip image file saved successfully.');
        //         // `ZipImage_${formatDate(uploadDate)}`
        //         try {
        //             // Extract the zip file
        //             await extractZipFile(destinationPath);
        //             // Call next middleware or continue with your logic here
        //         } catch (error) {
        //             // Handle error if extraction fails
        //         }
        //     });

        //     // Listen for any errors during the file write process
        //     writeStream.on('error', (error) => {
        //         console.error('Error saving zip image file:', error);
        //         // Handle the error appropriately
        //     });
        // } else {
        //     console.error('No zip image file uploaded.');
        //     // Handle the case where no zip image file is uploaded
        // }

        req.uploadedFiles = {
            firstInputCsvFile,
            // secondInputCsvFile,
            // zipfileName,
            // omrImages
        };
        next();
    });
};

module.exports = uploadCsv;


