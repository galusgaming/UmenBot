const { loadFiles } = require("../Function/fileLoader");
const ascii = require("ascii-table");
const table = new ascii().setHeading("events", "status");

async function loadEvents(client) {
  try {
    console.time("Events Loaded");
    client.events = new Map();
    const events = new Array();

    const files = await loadFiles("Events");

    for (const file of files) {
      try {
        const event = require(file);
        const execute = (...args) => event.execute(...args, client);
        const target = event.rest ? client.rest : client;

        target[event.once ? "once" : "on"](event.event, execute);
        client.events.set(event.name, execute);
        events.push({ Event: event.name, Status: "✅" });
      } catch (error) {
        events.push({
          Event: file.split("/").pop().slice(0, -3),
          Status: "🛑",
        });
      }
    }

    console.table(events, ["Event", "Status"]);
    console.info("\n\x1b[36m%s\x1b[0m", "loaded Events");
  } catch (error) {
    console.error(error);
  }
}

module.exports = { loadEvents };
