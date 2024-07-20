const Sequelize = require("sequelize");

const sequelize = require("../../utils/database");

const Assigndata = sequelize.define("assigndata", {
  userId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  templeteId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fileId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  taskName: {
    type: Sequelize.STRING,
    allowNull: true,
    // defaultValue:null,
  },
  max: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  min: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  taskStatus: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },

  moduleType: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  csvFilePath : {
    type : Sequelize.STRING,
  }
  ,
  errorFilePath: {
    type: Sequelize.STRING,
  },
  correctedCsvFilePath: {
    type: Sequelize.STRING,
  },
  imageDirectoryPath: {
    type: Sequelize.STRING,
  },
  currentIndex: {
    type: Sequelize.INTEGER,
  },
});

module.exports = Assigndata;
