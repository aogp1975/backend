/**
* This is the main Node.js server script for your project
* Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
*/

const path = require("path");


//supabase
const {createClient} = require('@supabase/supabase-js');

const supabaseUrl = 'https://lbzzklnxbneqdylgaetu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxienprbG54Ym5lcWR5bGdhZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTUwMTIsImV4cCI6MjA2ODY3MTAxMn0.mUdNEwdxCnS9CT0KJkjHDpBT6zg4wIkejDNC2DvRphQ';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false
});

// ADD FAVORITES ARRAY VARIABLE FROM TODO HERE
fastify.register(require('fastify-cors'), {
	origin: true
});

// Setup our static files
fastify.register(require('fastify-static'), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}


const fs = require("fs");
const geojsonPath = path.join(__dirname, "public", "stickers.geojson");

fastify.post("/guardar_ubi", async (request, reply) => {
		const {lat, lng, type, testimonio} = request.body;
		
		const {data, error} = await supabase
			.from('stickerspoints')
			.insert([
				{lat: lat, 
				 lng: lng, 
				 type: type, 
				 testimonio:testimonio}]);
		
		if (error) {
			reply.code(500).send({error: error.message });
		} else {
			reply.send({ok: true,data});
		}	
});

fastify.get('/creageojson', async (request, reply) => {
	const {data, error} = await supabase
		.from('stickerspoints')
		.select('*');
	if (error) {
		reply.code(500).send({error: error.message});
		return;
	}
	
	const geojson = {
			type: "FeatureCollection",
			features: data.map(p => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [p.longitud,p.latitud]
				},
				properties: {
					tipo: p.tipo,
					...(p.testimonio ? { testimonio: p.testimonio } : {})
			}
		}))
	};
		
	reply.send(geojson);
});


// Run the server and report out to the logs
const start = async () => {
	try {
		const address = await fastify.listen ({ port: process.env.PORT || 3000, host: '0.0.0.0' });
		console.log(`Your app is listening on ${address}`);
	} catch (err) {
		console.error('Error al iniciar el servidor:', err);
		process.exit(1);
	}
};

start ();

