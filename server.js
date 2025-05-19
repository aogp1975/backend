const express = require("express");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Genera un nombre de archivo único
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Asegura que la carpeta 'uploads' exista
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Servir archivos estáticos desde la carpeta 'uploads'
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const GEOJSON_FILE = "stickers.geojson";

// Asegura que el archivo GEOJSON exista
if (!fs.existsSync(GEOJSON_FILE)) {
  fs.writeFileSync(
    GEOJSON_FILE,
    JSON.stringify({ type: "FeatureCollection", features: [] }, null, 2)
  );
}

// Endpoint para guardar coordenadas e imagen
app.post("/guardar_completo", upload.single("imagen"), (req, res) => {
  const { latitud, longitud } = req.body;
  const archivo = req.file;

  if (!latitud || !longitud) {
    return res.status(400).json({ error: "Faltan coordenadas" });
  }

  let geojson = JSON.parse(fs.readFileSync(GEOJSON_FILE));

  let nuevaUbi = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [parseFloat(longitud), parseFloat(latitud)],
    },
    properties: {
      timestamp: new Date().toISOString(),
      imagen: archivo ? `/uploads/${archivo.filename}` : null
    },
  };

  geojson.features.push(nuevaUbi);

  fs.writeFileSync(GEOJSON_FILE, JSON.stringify(geojson, null, 2));
  res.json({ mensaje: "Registro completo", nuevaUbi });
});

// Endpoint para obtener el archivo GEOJSON
app.get("/stickers.geojson", (req, res) => {
  res.sendFile(path.join(__dirname, GEOJSON_FILE));
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
