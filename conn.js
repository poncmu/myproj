const { MongoClient } = require("mongodb");
const connectionString =
  "mongodb+srv://Pond:pon0891929256@cluster0.a5lslpf.mongodb.net";
const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnection;

module.exports = {
  connectToServer: function (callback) {
    console.log("Start connecting");
    client.connect(function (err, database) {
      if (err || !database) {
        console.log("Error");
        return callback(err);
      }
      dbConnection = database.db("SpecializationService");
      console.log("Successfully connected to MongoDB.");

      return callback();
    });
  },

  getDb: function () {
    return dbConnection;
  },
};
