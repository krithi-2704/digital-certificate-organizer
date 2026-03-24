const express = require("express");
const router = express.Router();
const Certificate = require("../models/Certificate");
const upload = require("../middleware/upload");

// ADD CERTIFICATE (with file upload)
router.post("/add", upload.single("file"), async (req, res) => {
  try {
    const newCertificate = new Certificate({
      title: req.body.title,
      issuer: req.body.issuer,
      date: req.body.date,
      fileUrl: req.file ? req.file.filename : ""
    });

    const savedCertificate = await newCertificate.save();
    res.json(savedCertificate);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET ALL CERTIFICATES
router.get("/all", async (req, res) => {
  try {
    const certificates = await Certificate.find();
    res.json(certificates);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// DELETE CERTIFICATE
router.delete("/delete/:id", async (req, res) => {
  try {
    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ message: "Certificate deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// UPDATE CERTIFICATE
router.put("/update/:id", async (req, res) => {
  try {
    const updatedCertificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedCertificate);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;