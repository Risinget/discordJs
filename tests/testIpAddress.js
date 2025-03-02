const mcs = require("node-mcstatus");
// const host = "pandorab.org";
const host = "mc.hypixel.net";
const port = 25565;
const options = { query: true };

// The `port` argument is optional and defaults
// to 25565. The `options` argument is optional.
mcs
  .statusJava(host, port, options)
  .then((result) => {
    console.log(result);
    
    if (result.online == false) {
        console.log("Server is offline");
    } else {
        console.log("Server is online");
        console.log("The server has " + result.players.online + " players online");
    }
    
  })
  .catch((error) => {
    // If the server is offline, then
    // you will NOT receive an error here.
    // Instead, you will use the `result.online`
    // boolean values in `.then()`.
    // Receiving an error here means that there
    // was an error with the service itself.
  });
