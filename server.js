/**
 * This is the main Node.js server script for your project
 * Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
 */
const multer = require('multer');
const upload = multer ({ dest: 'uploads/'});


const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); //permite solicitudes desde cualquier origen

app.use('/uploads', express.static('uploads'));

const GEOJSON_FILE = "stickers.geojson";

if (!fs.existsSync(GEOJSON_FILE)) {
  fs.writeFileSync(
    GEOJSON_FILE,
    JSON.stringify({ type: "FeatureCollection", features: [] }, null, 2)
  );
}

//Endpoint para la ubi y se guarda en .geojson
app.post("/guardar_todo", upload.single('imagen'), (req, res) => {
  const { latitud, longitud } = req.body;
  const archivo = req.file;

  if (!latitud || !longitud) {
    return res.status(400).json({ error: "Hacen falta coordenadas" });
  }

  //Archivo actual
  let geojson = JSON.parse(fs.readFileSync(GEOJSON_FILE));

  //Agregar la nueva ubicación como feature
  let nuevaUbi = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [parseFloat(longitud), parseFloat(latitud)],
    },
    properties: {
      timestamp: new Date().toISOString(),
      imagen: archivo ? `/uploads/${archivo.filename}`: null
    },
  };

  geojson.features.push(nuevaUbi);

  //Guardar el archivo actualizado
  fs.writeFileSync(GEOJSON_FILE, JSON.stringify(geojson, null, 2));

  res.json({ mensaje: "Ubicación guardada correctamente", nuevaUbi });
});

//Archivo .geojson para Mapbox
app.get("/stickers.geojson", (req, res) => {
  res.sendFile(__dirname + "/" + GEOJSON_FILE);
});

//Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
