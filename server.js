const express = require("express");
const app = express();
const cors = require("cors");
const sequelize = require("./utils/database");
const bodyParser = require("body-parser");
const templeteRoutes = require("./routes/templete");
const userRoutes = require("./routes/userManagement");
const compareCsv = require("./routes/compareCsv");
const Templete = require("./models/TempleteModel/templete");
const User = require("./models/User");
const MetaData = require("./models/TempleteModel/metadata");
const Files = require("./models/TempleteModel/files");
const UpdatedData = require("./models/TempleteModel/updatedData");
const PORT = 4000;
const upload = require("./routes/upload");
const path = require("path");
const bcrypt = require("bcryptjs");
const Assigndata = require("./models/TempleteModel/assigndata");
const RowIndexData = require("./models/TempleteModel/rowIndexData");
const ImageDataPath = require("./models/TempleteModel/templeteImages");
const MappedData = require("./models/TempleteModel/mappedData");
const builtPath = path.join(__dirname, "./build");

//middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));


app.use("/images", express.static(path.join(__dirname, "extractedFiles")));
app.use(express.static(builtPath));

app.use("/users", userRoutes);
app.use(upload);
app.use(compareCsv);
app.use(templeteRoutes);

// Define associations with cascading deletes
Templete.hasMany(MetaData, {
  foreignKey: {
    name: "templeteId",
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

MetaData.belongsTo(Templete, {
  foreignKey: {
    name: "templeteId",
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

Templete.hasMany(Files, {
  foreignKey: {
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

Files.belongsTo(Templete, {
  foreignKey: {
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

Assigndata.hasMany(RowIndexData, {
  foreignKey: {
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

RowIndexData.belongsTo(Assigndata, {
  foreignKey: {
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

Templete.hasMany(ImageDataPath, {
  foreignKey: {
    name: "templeteId",
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

ImageDataPath.belongsTo(Templete, {
  foreignKey: {
    name: "templeteId",
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

UpdatedData.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

User.hasMany(UpdatedData, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

Templete.hasMany(MappedData, {
  foreignKey: {
    name: "templeteId",
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

MappedData.belongsTo(Templete, {
  foreignKey: {
    name: "templeteId",
    allowNull: false,
  },
  onUpdate: "CASCADE",
});

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// sequelize
//   .sync({ force: false })
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("Unable to connect to the database:", err);
//   });

sequelize
  .sync({ force: false })
  .then(async () => {
    // Check if the admin user table exists, if not, create it
    const adminUser = await User.findOne({ where: { role: "admin" } });
    const hashedPassword = await bcrypt.hash("123456", 12);
    if (!adminUser) {
      await User.create({
        userName: "admin",
        mobile: "1234567891",
        password: hashedPassword,
        role: "Admin",
        email: "admin@gmail.com",
        permissions: {
          dataEntry: true,
          comparecsv: true,
          csvuploader: true,
          createTemplate: true,
          resultGenerator: true,
        },
      });
    }
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
