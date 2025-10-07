const { uploadFile } = require("../controllers/uploadController");
const fs = require("fs");
const mammoth = require("mammoth");

// 🔧 Mocks de dependencias externas
jest.mock("fs", () => ({
    unlinkSync: jest.fn(),
}));

jest.mock("mammoth", () => ({
    extractRawText: jest.fn(),
}));

describe("📂 uploadFile controller (unit)", () => {
    let req, res;

    beforeEach(() => {
        req = {
            file: {
                path: "uploads/test.docx",
                mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    test("❌ retorna 400 si no hay archivo", async () => {
        req.file = null;
        await uploadFile(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "No se subió ningún archivo" })
        );
    });

    test("❌ retorna 400 si el formato no es .docx", async () => {
        req.file.mimetype = "image/png";
        await uploadFile(req, res);
        expect(fs.unlinkSync).toHaveBeenCalledWith(req.file.path);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Formato no soportado. Solo DOCX" })
        );
    });

    test("✅ procesa archivo correctamente y devuelve texto", async () => {
        mammoth.extractRawText.mockResolvedValue({ value: "Texto extraído de prueba " });

        await uploadFile(req, res);

        expect(mammoth.extractRawText).toHaveBeenCalledWith(
            expect.objectContaining({ path: req.file.path })
        );
        expect(fs.unlinkSync).toHaveBeenCalledWith(req.file.path);
        expect(res.json).toHaveBeenCalledWith({ text: "Texto extraído de prueba" });
    });

    test("⚠️ maneja error en mammoth correctamente", async () => {
        mammoth.extractRawText.mockRejectedValue(new Error("falló el parseo"));

        await uploadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "Error procesando archivo" })
        );
    });
});
