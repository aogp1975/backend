/**
* This is the main Node.js server script for your project
* Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
*/

const path = require("path");

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

/**
* Our home page route
*
* Returns src/pages/index.hbs with data built into it
*/
fastify.get("/", function(request, reply) {
  
  // params is an object we'll pass to our handlebars template
  let params = { seo: seo };
  
  // If someone clicked the option for a random color it'll be passed in the querystring
  if (request.query.randomize) {
    
    // We need to load our color data file, pick one at random, and add it to the params
    const colors = require("./src/colors.json");
    const allColors = Object.keys(colors);
    let currentColor = allColors[(allColors.length * Math.random()) << 0];
    
    // Add the color properties to the params object
    params = {
      color: colors[currentColor],
      colorError: null,
      seo: seo
    };
  }
  
  // The Handlebars code will be able to access the parameter values and build them into the page
  reply.view("/src/pages/index.hbs", params);
});

/**
* Our POST route to handle and react to form submissions 
*
* Accepts body data indicating the user choice
*/
fastify.post("/", function(request, reply) {
  
  // Build the params object to pass to the template
  let params = { seo: seo };
  
  // If the user submitted a color through the form it'll be passed here in the request body
  let color = request.body.color;
  
  // If it's not empty, let's try to find the color
  if (color) {
    // ADD CODE FROM TODO HERE TO SAVE SUBMITTED FAVORITES
    
    // Load our color data file
    const colors = require("./src/colors.json");
    
    // Take our form submission, remove whitespace, and convert to lowercase
    color = color.toLowerCase().replace(/\s/g, "");
    
    // Now we see if that color is a key in our colors object
    if (colors[color]) {
      
      // Found one!
      params = {
        color: colors[color],
        colorError: null,
        seo: seo
      };
    } else {
      
      // No luck! Return the user value as the error property
      params = {
        colorError: request.body.color,
        seo: seo
      };
    }
  }
  
  // The Handlebars template will use the parameter values to update the page with the chosen color
  reply.view("/src/pages/index.hbs", params);
});
const fs = require("fs");
const geojsonPath = path.join(__dirname, "public", "stickers.geojson");

fastify.post("/guardar_ubi", async (request, reply) => {
	try {
		const {latitud, longitud, tipo, testimonio} = request.body;
		
		//cargar el geojson
		const data = fs.readFileSync(geojsonPath);
		const geojson = JSON.parse(data);
		
		const nuevaFeature = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [longitud,latitud]
			},
			properties: {
				tipo: tipo,
				...(testimonio ? { testimonio } : {})
			}
		};
		
		geojson.features.push(nuevaFeature);
		
		fs.writeFileSync(geojsonPath, JSON.stringify(geojson, null, 2));
		
		reply.send({ status: "ok", mensaje: "Ubi registrada" });
	} catch (err) {
		console.error(err);
		reply.status(500).send({error: "no se guardo ubi:("});
	}
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

