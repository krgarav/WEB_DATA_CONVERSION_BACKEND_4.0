function groupByPrimaryKey(arr) {
    const grouped = {};
  
    arr.forEach((item) => {
      const primaryKey = item["PRIMARY"].trim();
      if (!grouped[primaryKey]) {
        grouped[primaryKey] = {
          PRIMARY_KEY: item["PRIMARY KEY"],
          IMAGE_NAME: item["IMAGE_NAME"],
          DATA: [],
        };
      }
      const dataItem = { ...item };
      delete dataItem["PRIMARY"];   
      delete dataItem["PRIMARY KEY"];
      delete dataItem["IMAGE_NAME"];
      grouped[primaryKey].DATA.push(dataItem);
    });
  
    return Object.keys(grouped).map((key) => ({
      PRIMARY: key,
      PRIMARY_KEY: grouped[key].PRIMARY_KEY,
      IMAGE_NAME: grouped[key].IMAGE_NAME,
      DATA: grouped[key].DATA,
    }));
  }
  module.exports = groupByPrimaryKey;