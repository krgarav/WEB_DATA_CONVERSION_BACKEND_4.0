const path = require("path");
const fs = require("fs");
const csvToJson = require("../../services/csvExtractor");
const { parse } = require('json2csv');

function isBlank(str) {
    return !str.trim().length;
}
// Function to group and sort by PRIMARY key
function groupByPrimaryKey(arr) {
    const grouped = {};

    arr.forEach(item => {
        const primaryKey = item["PRIMARY"].trim();
        if (!grouped[primaryKey]) {
            grouped[primaryKey] = {
                PRIMARY_KEY: item["PRIMARY KEY"],
                IMAGE_NAME: item["IMAGE_NAME"],
                DATA: []
            };
        }
        const dataItem = { ...item };
        delete dataItem["PRIMARY"];
        delete dataItem["PRIMARY KEY"];
        delete dataItem["IMAGE_NAME"];
        grouped[primaryKey].DATA.push(dataItem);
    });

    return Object.keys(grouped).map(key => ({
        PRIMARY: key,
        PRIMARY_KEY: grouped[key].PRIMARY_KEY,
        IMAGE_NAME: grouped[key].IMAGE_NAME,
        DATA: grouped[key].DATA
    }));
}

const compareCsv = async (req, res) => {

    try {
        // Access other form data parameters
        const { firstInputFileName, secondInputFileName, primaryKey, skippingKey, imageColName, formFeilds } = req.body;
        const { omrImages } = req.uploadedFiles;
        const firstCSVFile = req.uploadedFiles.firstInputCsvFile
        const secondCSVFile = req.uploadedFiles.secondInputCsvFile
        const firstFilePath = path.join(__dirname, "../", "../", "COMPARECSV_FILES", "multipleCsvCompare", firstInputFileName);
        const secondFilePath = path.join(__dirname, "../", "../", "COMPARECSV_FILES", "multipleCsvCompare", secondInputFileName);
        const f1 = await csvToJson(firstFilePath)
        const f2 = await csvToJson(secondFilePath)

        const diff = [];

        for (let i = 0; i < f1.length; i++) {
            if (isBlank(f1[i][primaryKey])) {
                return res.status(501).send({ err: "Primary key cannot be blank" });
            }
        }
        for (let j = 0; j < f2.length; j++) {
            if (isBlank(f2[j][primaryKey])) {
                return res.status(501).send({ err: "Primary key cannot be blank" });
            }
        }


        for (let i = 0; i < f1.length; i++) {
            for (let j = 0; j < f2.length; j++) {
                const pkLength = f1[i][primaryKey].length;
                const str = " ".repeat(pkLength);
                if (f1[i][primaryKey] === f2[j][primaryKey] && f1[i][primaryKey] !== str && f2[i][primaryKey] !== str) {
                    for (let [key, value] of Object.entries(f1[i])) {
                        const val1 = value;
                        const val2 = f2[j][key];
                        const imgPathArr = f1[i][imageColName]?.split("\\");
                        const imgName = imgPathArr[imgPathArr.length - 1]
                        if (val1.includes("*") || val2.includes("*") || /^\s*$/.test(val1) || /^\s*$/.test(val2)) {
                            if (!skippingKey.includes(key) && formFeilds.includes(key)) {
                                const obj = {
                                    "PRIMARY": ` ${f1[i][primaryKey]}`,
                                    "COLUMN_NAME": key,
                                    "FILE_1_DATA": val1,
                                    "FILE_2_DATA": val2,
                                    "IMAGE_NAME": imgName,
                                    "CORRECTED": [],
                                    "CORRECTED BY": "",
                                    "PRIMARY KEY": primaryKey
                                }
                                diff.push(obj);
                            }
                        } else if (value !== f2[j][key]) {
                            if (!skippingKey.includes(key)) {
                                const obj = {
                                    "PRIMARY": ` ${f1[i][primaryKey]}`,
                                    "COLUMN_NAME": key,
                                    "FILE_1_DATA": val1,
                                    "FILE_2_DATA": val2,
                                    "IMAGE_NAME": imgName,
                                    "CORRECTED": [],
                                    "CORRECTED BY": "",
                                    "PRIMARY KEY": primaryKey
                                }
                                diff.push(obj);
                            }
                        }
                    }
                }

            }

        }


        // // Process the data into a format suitable for a CSV
        // const rows = [];

        // jsonData.forEach(item => {
        //     item.DATA.forEach(entry => {
        //         rows.push({
        //             PRIMARY: item.PRIMARY,
        //             PRIMARY_KEY: item.PRIMARY_KEY,
        //             IMAGE_NAME: item.IMAGE_NAME,
        //             COLUMN_NAME: entry.COLUMN_NAME,
        //             FILE_1_DATA: entry.FILE_1_DATA,
        //             FILE_2_DATA: entry.FILE_2_DATA,
        //             CORRECTED: entry.CORRECTED.join(', '),
        //             'CORRECTED BY': entry['CORRECTED BY']
        //         });
        //     });
        // });

        const csvData = parse(diff);
        // const csvData = parse(arr)
        const correctedCsv = parse(f1);
        const directoryPath = path.join(__dirname, "../", "../", "COMPARECSV_FILES", 'ErrorCsv');
        // Create directory if it doesn't exist
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
        const CorrectionDirectoryPath = path.join(__dirname, "../", "../", "COMPARECSV_FILES", 'CorrectedCsv');
        // Create directory if it doesn't exist
        if (!fs.existsSync(CorrectionDirectoryPath)) {
            fs.mkdirSync(CorrectionDirectoryPath, { recursive: true });
        }
        // Function to format date for file names
        const formatDate = (date) => {
            return date.toISOString().replace(/[:.]/g, '-'); // Replace colons and periods with dashes
        };
        // Specify the file path within the directory
        const errorDate = new Date();
        const errorFilePath = path.join(directoryPath, `error_${formatDate(errorDate)}.csv`);

        fs.writeFile(errorFilePath, csvData, (err) => {
            if (err) {
                console.error('Error writing CSV file:', err);
            } else {
                console.log('CSV file saved successfully.');
            }
        });
        const correctionDate = new Date();
        const correctionFilePath = path.join(CorrectionDirectoryPath, `corrected_${formatDate(correctionDate)}.csv`);
        fs.writeFile(correctionFilePath, correctedCsv, (err) => {
            if (err) {
                console.error('Error writing CSV file:', err);
            } else {
                console.log('CSV file saved successfully.');
            }
        });
        // Set the content type to CSV
        res.set('Content-Type', 'text/csv');

        // Set the content disposition header to trigger download
        res.set('Content-Disposition', 'attachment; filename="data.csv"');


        const groupedArray = groupByPrimaryKey(diff);
        // Send the CSV data as the response
        res.status(200).send({
            csvFile: f1,
            data: groupedArray,
            errorFilePath: errorFilePath,
            correctedFilePath: correctionFilePath,
            imageDirectoryName: omrImages

        });
    } catch (err) {
        // console.log(err)
        res.status(501).send({ error: err })
    }
}

module.exports = compareCsv;

