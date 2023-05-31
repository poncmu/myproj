const express = require("express");
let server = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const { connectToServer } = require("./conn");
const { Db } = require("mongodb");
const mongo = require("mongodb");
const { MongoClient, listDatabases } = require("mongodb");
const uri =
  "mongodb+srv://Pond:pon0891929256@cluster0.a5lslpf.mongodb.net/?retryWrites=true&w=majority";
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
server.use(bodyParser.json()); // ให้ server(express) ใช้งานการ parse json
server.use(morgan("dev")); // ให้ server(express) ใช้งานการ morgam module
server.use(cors()); // ให้ server(express) ใช้งานการ cors module
const client = new MongoClient(uri);
require("dotenv").config();

server.get("/SearchSpecLists", async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");

  const specCollection = db.collection("specLists");
  let speclist = await specCollection.find({}).toArray();

  // const isInvalid = typeof Id === String;
  // console.log(isInvalid);
  return res.status(404).json({
    data: speclist,
  });
});

server.get("/SearchCourseByCourseId", async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");

  let Id = req.query.courseId;

  const courseCollection = db.collection("courseLists");
  let searchCourseFromId = await courseCollection.find({}).toArray();
  const courseFound = searchCourseFromId.filter((course) => {
    return course._id.toString() === String(Id);
  });

  const specCollection = db.collection("specLists");
  let searchSpecFromId = await specCollection.find({}).toArray();
  for (const course of courseFound) {
    const specArr = [];
    for (const speclist of course.specialization) {
      const specList = searchSpecFromId.filter((spec) => {
        return spec._id.toString() === speclist;
      });
      specArr.push(specList[0].specTitle.toString());
    }

    course.specialization = specArr;
    delete course._id;
  }

  const isFound = courseFound.length > 0;
  if (isFound) {
    return res.status(200).json({
      data: courseFound,
    });
  }
  // const isInvalid = typeof Id === String;
  // console.log(isInvalid);
  return res.status(404).json({
    msg: "Course is not found",
  });
});

server.get("/SearchCourseBySpecId", async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");

  let Id = req.query.specId;

  const courseCollection = db.collection("courseLists");
  let searchCourseFromSpec = await courseCollection.find({}).toArray();
  const courseFound = searchCourseFromSpec.filter((course) => {
    return String(course.specialization) === String(Id);
  });

  const specCollection = db.collection("specLists");
  let searchSpecFromId = await specCollection.find({}).toArray();
  for (const course of courseFound) {
    const specArr = [];
    for (const speclist of course.specialization) {
      const specList = searchSpecFromId.filter((spec) => {
        return spec._id.toString() === String(speclist);
      });
      specArr.push(specList[0].specTitle.toString());
    }

    course.specialization = specArr;
    delete course._id;
  }

  const isFound = courseFound.length > 0;

  if (isFound) {
    return res.status(200).json({
      data: courseFound,
    });
  }
  return res.status(404).json({
    msg: "Course is not found",
  });
});

server.get("/SearchCourseByCourseNo", async function (req, res, next) {
  await client.connect();

  let CourseNo = req.query.courseNo;
  const db = client.db("SpecializationService");
  const courseCollection = db.collection("courseLists");

  let courseList = await courseCollection
    .find({ courseNo: String(CourseNo) })
    .toArray();
  const specCollection = db.collection("specLists");
  let searchSpecFromId = await specCollection.find({}).toArray();

  let specArr = [];
  // console.log(courseList);
  let isNotFound = courseList.length <= 0;
  if (isNotFound) {
    return res.status(404).json({
      msg: "Course is not found",
    });
  }
  for (const speclist of courseList[0].specialization) {
    const specList = searchSpecFromId.filter((spec) => {
      return spec._id.toString() === String(speclist);
    });
    specArr.push(specList[0].specTitle.toString());
  }
  courseList[0].specialization = specArr;
  delete courseList[0]._id;

  return res.status(200).json({
    data: courseList[0],
  });
});

server.get("/SearchCourseBySpecTitle", async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");

  const specCollection = db.collection("specLists");
  const courseCollection = db.collection("courseLists");
  let Spec = req.query.spectitle;

  let specFound = await specCollection
    .find({ specTitle: String(Spec) })
    .toArray();

  // console.log(specFound);

  let courseFound;
  if (specFound.length !== 0) {
    courseFound = await courseCollection
      .find({ specialization: String(specFound[0]._id) })
      .toArray();
  }

  let isNotFound = specFound.length <= 0 || courseFound.length <= 0;
  if (isNotFound) {
    return res.status(404).json({
      msg: "Course or specialization is not found",
    });
  }

  let searchSpecFromId = await specCollection.find({}).toArray();
  for (const course of courseFound) {
    const specArr = [];
    for (const speclist of course.specialization) {
      const specList = searchSpecFromId.filter((spec) => {
        return spec._id.toString() === String(speclist);
      });
      specArr.push(specList[0].specTitle.toString());
    }

    course.specialization = specArr;
    delete course._id;
  }

  return res.status(200).json({
    data: courseFound,
  });
});

server.put(
  "/EditSpeclistsBySpecId",
  jsonParser,
  async function (req, res, next) {
    await client.connect();

    const db = client.db("SpecializationService");
    const specCollection = db.collection("specLists");
    let oldSpecId = req.body.spec;
    let newSpec = req.body.newSpecTitle;

    let searchSpecFromId = await specCollection.find({}).toArray();
    let specFound = searchSpecFromId.filter((spec) => {
      return String(spec._id) === String(oldSpecId);
    });
    let isNotFound = specFound.length <= 0;
    if (isNotFound) {
      return res.status(404).json({
        msg: "Specialization is not found",
      });
    }

    let foundDup = searchSpecFromId.filter((spec) => {
      return String(spec.specTitle) === String(newSpec);
    });
    let isDuplicate = foundDup.length > 0;
    if (isDuplicate) {
      return res.status(404).json({
        msg: "Duplicate specialization name",
      });
    }

    let result = await specCollection.updateOne(
      { specTitle: String(specFound[0].specTitle) },
      { $set: { specTitle: String(newSpec) } }
    );

    let search = await specCollection.find({}).toArray();
    let findOut = search.filter((spec) => {
      return spec._id.toString() === String(oldSpecId);
    });
    findOut[0].specTitle = String(newSpec);
    delete findOut[0]._id;

    return res.status(200).json({
      status: "Editted",
      data: findOut[0],
    });
  }
);

server.put(
  "/EditSpeclistsByOldSpecTitle",
  jsonParser,
  async function (req, res, next) {
    await client.connect();

    const db = client.db("SpecializationService");
    const specCollection = db.collection("specLists");
    let oldSpec = req.body.oldSpecTitle;
    let newSpec = req.body.newSpecTitle;

    let specFound = await specCollection
      .find({ specTitle: String(oldSpec) })
      .toArray();
    let isNotFound = specFound.length <= 0;
    if (isNotFound) {
      return res.status(404).json({
        msg: "Specialization is not found",
      });
    }
    let searchSpecFromId = await specCollection.find({}).toArray();
    let foundDup = searchSpecFromId.filter((spec) => {
      return String(spec.specTitle) === String(newSpec);
    });
    let isDuplicate = foundDup.length > 0;
    // let isDuplicate = String(specFound[0].specTitle) === String(newSpec);
    if (isDuplicate) {
      return res.status(400).json({
        msg: "Duplicate specialization name",
      });
    }

    let result = await specCollection.updateOne(
      { specTitle: String(oldSpec) },
      { $set: { specTitle: String(newSpec) } }
    );

    let search = await specCollection.find({}).toArray();
    let findOut = search.filter((spec) => {
      return String(spec.specTitle) === String(newSpec);
    });
    findOut[0].specTitle = String(newSpec);
    delete findOut[0]._id;

    return res.status(200).json({
      status: "Editted",
      data: findOut[0],
    });
  }
);

server.post("/InsertCourselists", jsonParser, async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");
  const courseCollection = db.collection("courseLists");
  let CourseNo = req.body.newCourseNo;

  const digits = parseInt(process.env.DIGITSCOURSE);
  const isInvalid = CourseNo.length !== digits || isNaN(CourseNo);
  if (isInvalid) {
    return res.status(400).json({
      msg: "The value must be " + digits + " digits number",
    });
  }

  let courseFound = await courseCollection
    .find({ courseNo: String(CourseNo) })
    .toArray();

  let isDuplicate = courseFound.length > 0;
  if (isDuplicate) {
    return res.status(400).json({
      msg: "Duplicate course",
    });
  }

  let inserted = await db.collection("courseLists").insertOne({
    courseNo: String(CourseNo),
    specialization: [],
  });
  let findOut = await courseCollection
    .find({ courseNo: String(CourseNo) })
    .toArray();
  delete findOut[0]._id;

  return res.status(200).json({
    status: "Inserted",
    data: findOut[0],
  });
});

server.post("/InsertSpeclists", jsonParser, async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");
  const specCollection = db.collection("specLists");
  let newSpecTitle = req.body.newSpecialization;

  let specFound = await specCollection
    .find({ specTitle: String(newSpecTitle) })
    .toArray();
  let isDuplicate = specFound.length > 0;
  if (isDuplicate) {
    return res.status(400).json({
      msg: "Duplicate specialization name",
    });
  }

  let inserted = await db.collection("specLists").insertOne({
    specTitle: String(newSpecTitle),
  });

  let findOut = await specCollection
    .find({ specTitle: String(newSpecTitle) })
    .toArray();
  delete findOut[0]._id;
  return res.status(200).json({
    status: "Inserted",
    data: findOut[0],
  });
});

server.post(
  "/InsertSpecializationBySpecId",
  jsonParser,
  async function (req, res, next) {
    await client.connect();

    const db = client.db("SpecializationService");
    const courseCollection = db.collection("courseLists");
    const specCollection = db.collection("specLists");

    let CourseNo = req.body.courseNo;
    let courseFound = await courseCollection
      .find({ courseNo: String(CourseNo) })
      .toArray();

    let newSpecId = req.body.newSpecializationId;
    let searchSpecFromId = await specCollection.find({}).toArray();
    let specFound = searchSpecFromId.filter((spec) => {
      return spec._id.toString() === String(newSpecId);
    });

    // console.log(foundDup);
    let isNotFound = specFound.length <= 0 || courseFound.length <= 0;
    if (isNotFound) {
      return res.status(404).json({
        msg: "Course or specialization is not found",
      });
    }
    // console.log(courseFound[0].specialization);
    let foundDup = courseFound[0].specialization.filter((spec) => {
      return String(spec) === String(newSpecId);
    });
    // let foundDup = courseFound[0].specialization.find(
    //   (sID) => sID === String(newSpecId)
    // );
    let isDuplicate = foundDup.length > 0;
    if (isDuplicate) {
      return res.status(400).json({
        msg: "Duplicate specialization",
      });
    }

    let inserted = await db
      .collection("courseLists")
      .updateOne(
        { courseNo: String(CourseNo) },
        { $push: { specialization: String(newSpecId) } }
      );
    let findOut = await courseCollection
      .find({ courseNo: String(CourseNo) })
      .toArray();
    for (const course of findOut) {
      const specArr = [];
      for (const speclist of findOut[0].specialization) {
        const specList = searchSpecFromId.filter((spec) => {
          return spec._id.toString() === speclist;
        });
        specArr.push(specList[0].specTitle.toString());
      }

      course.specialization = specArr;
      delete course._id;
    }
    // delete findOut[0]._id;
    return res.status(200).json({
      status: "Inserted",
      data: findOut[0],
    });
  }
);

server.delete("/DeleteCourselistsByCourseId", async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");
  const courseCollection = db.collection("courseLists");
  let deletedCourse = req.query.deletedCourseId;

  let searchCourseFromId = await courseCollection.find({}).toArray();
  const courseFound = searchCourseFromId.filter((course) => {
    return course._id.toString() === String(deletedCourse);
  });

  let isNotFound = courseFound.length <= 0;
  if (isNotFound) {
    return res.status(404).json({
      msg: "Course is not found",
    });
  }
  await db.collection("courseLists").deleteOne({
    _id: new mongo.ObjectId(String(deletedCourse)),
  });
  return res.status(200).json({
    status: courseFound[0].courseNo + " has been deleted from Courselists",
  });
});

server.delete("/DeleteCourselistsByCourseNo", async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");
  const courseCollection = db.collection("courseLists");
  let deletedCourse = req.query.deletedCourseNo;

  let courseFound = await courseCollection
    .find({ courseNo: String(deletedCourse) })
    .toArray();

  let isNotFound = courseFound.length <= 0;
  if (isNotFound) {
    return res.status(404).json({
      msg: "Course is not found",
    });
  }
  await db.collection("courseLists").deleteOne({
    courseNo: String(deletedCourse),
  });
  return res.status(200).json({
    status: courseFound[0].courseNo + " has been deleted from Courselists",
  });
});

server.delete("/DeleteSpeclistsBySpecId", async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");
  const specCollection = db.collection("specLists");
  const courseCollection = db.collection("courseLists");
  let deletedSpec = req.query.deletedSpecId;

  let searchSpecFromId = await specCollection.find({}).toArray();
  const specFound = searchSpecFromId.filter((spec) => {
    return spec._id.toString() === String(deletedSpec);
  });

  let isNotFound = specFound.length <= 0;
  if (isNotFound) {
    return res.status(404).json({
      msg: "Specialization is not found",
    });
  }

  let courseFound = await courseCollection
    .find({ specialization: String(specFound[0]._id) })
    .toArray();
  let cannotDelete = courseFound.length > 0;
  if (cannotDelete) {
    return res.status(400).json({
      msg: "This specialization can't be deleted due to being used by others course",
    });
  }

  deleted = await db.collection("specLists").deleteOne({
    _id: new mongo.ObjectId(String(deletedSpec)),
  });
  return res.status(200).json({
    status:
      specFound[0].specTitle +
      " specialization has been deleted from Speclists",
  });
});

server.delete("/DeleteSpeclistsBySpecTitle", async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");
  const specCollection = db.collection("specLists");
  const courseCollection = db.collection("courseLists");
  let deletedSpec = req.query.deletedSpecTitle;

  let specFound = await specCollection
    .find({ specTitle: String(deletedSpec) })
    .toArray();

  let isNotFound = specFound.length <= 0;
  if (isNotFound) {
    return res.status(404).json({
      msg: "Specialization is not found",
    });
  }

  let courseFound = await courseCollection
    .find({ specialization: String(specFound[0]._id) })
    .toArray();
  let cannotDelete = courseFound.length > 0;
  if (cannotDelete) {
    return res.status(400).json({
      msg: "This specialization can't be deleted due to being used by others course",
    });
  }

  await db.collection("specLists").deleteOne({
    specTitle: String(deletedSpec),
  });
  return res.status(200).json({
    status: specFound[0].specTitle + " has been deleted from Speclists",
  });
});

server.delete("/DeleteSpecializationBySpecId", async function (req, res, next) {
  await client.connect();
  const db = client.db("SpecializationService");
  const specCollection = db.collection("specLists");
  const courseCollection = db.collection("courseLists");
  let deletedSpec = req.query.deletedSpecId;
  let CourseNo = req.query.courseNo;

  let searchSpecFromId = await specCollection.find({}).toArray();

  let specFound = searchSpecFromId.filter((spec) => {
    return spec._id.toString() === String(deletedSpec);
  });

  let courseFound = await courseCollection
    .find({ courseNo: String(CourseNo) })
    .toArray();

  let isNotFound = specFound.length <= 0 || courseFound.length <= 0;
  if (isNotFound) {
    return res.status(404).json({
      msg: "Course or specialization is not found",
    });
  }
  // deletedSpec
  let specArr = [];
  let deletedNotFound = true;
  for (const speclist of courseFound[0].specialization) {
    const specList = searchSpecFromId.filter((spec) => {
      return spec._id.toString() === speclist;
    });
    if (String(specList[0]._id) !== String(deletedSpec)) {
      specArr.push(specList[0]._id.toString());
    } else {
      deletedNotFound = false;
    }
  }

  if (deletedNotFound) {
    return res.status(404).json({
      msg: "There's no this specialization in the course",
    });
  }

  let result = await courseCollection.updateOne(
    { specialization: String(deletedSpec) },
    { $set: { specialization: specArr } }
  );
  let findOut = await courseCollection
    .find({ courseNo: String(CourseNo) })
    .toArray();
  for (const course of findOut) {
    const specArr = [];
    for (const speclist of findOut[0].specialization) {
      const specList = searchSpecFromId.filter((spec) => {
        return spec._id.toString() === speclist;
      });
      specArr.push(specList[0].specTitle.toString());
    }

    course.specialization = specArr;
    delete course._id;
  }
  return res.status(200).json({
    status: "Deleted",
    data: findOut[0],
  });
});

server.listen(3000, async function () {
  try {
    await client.connect();
    console.log("Server connected");
  } catch (e) {
    await client.close();
    console.log("Server closed");
  }
});
