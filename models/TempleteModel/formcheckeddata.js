const Sequelize = require("sequelize");

const sequelize = require("../../utils/database");

const FormCheckedData = sequelize.define("formcheckeddata", {
  key: {
    type: Sequelize.STRING,
  },
  value: {
    type: Sequelize.STRING,
  },
  legal: {
    type: Sequelize.BOOLEAN,
  },
  blank: {
    type: Sequelize.BOOLEAN,
  },
  pattern: {
    type: Sequelize.BOOLEAN,
  },
  fileID: {
    type: Sequelize.STRING,
  },
});

module.exports = FormCheckedData;
