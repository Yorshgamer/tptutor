const fs = require("fs");
const mammoth = require("mammoth");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ path: req.file.path });
      fs.unlinkSync(req.file.path);
      return res.json({ text: result.value.trim() });
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Formato no soportado. Solo DOCX" });
    }
  } catch (err) {
    console.error("❌ Error procesando DOCX:", err.message);
    res.status(500).json({ error: "Error procesando archivo" });
  }
};
