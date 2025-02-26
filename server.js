/**
 * This is the main Node.js server script for your project
 * Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
 */

const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); //permite solicitudes desde cualquier origen

const GEOJSON_FILE = "stickers.geojson";

if (!fs.existsSync(GEOJSON_FILE)) {
  fs.writeFileSync(GEOJSON_FILE, JSON.stringify({ type: "FeatureCollection", features: [] }, null, 2)); 
}

//Endpoint para la ubi y se guarda en .geojson
app.post("/guardar_ubi", (req,res) => {
  const {latitud, longitud} = req.body;
  
  if (!latitud || !longitud) {
    return res.status(400).json({ error: "Hacen falta coordenadas"});
  }
  
  //Archivo actual 
  let geojson = JSON.parse(fs.readFileSync(GEOJSON_FILE));
  
  //Agregar la nueva ubicación como feature
  let nuevaUbi = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [longitud, latitud]
    },
    properties: {
      timestamp: new Date().toISOString()
    }
  };
  
  geojson.features.push(nuevaUbi);
  
  //Guardar el archivo actualizado
  fs.writeFileSync(GEOJSON_FILE, JSON.stringify(geojson, null, 2));
  
  res.json({ mensaje: "Ubicación guardada correctamente", nuevaUbi});
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