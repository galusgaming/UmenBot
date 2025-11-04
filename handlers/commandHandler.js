async function loadCommands(client) {
  const { loadFiles } = require("../Function/fileLoader");
  const ascii = require("ascii-table");
  const table = new ascii().setHeading("commands", "Status");

  await client.commands.clear();

  let commandsArray = [];

  const Files = await loadFiles("Commands");
  Files.forEach((file) => {
    try {
      const command = require(file);
      client.commands.set(command.data.name, command);
      commandsArray.push(command.data.toJSON());
      table.addRow(command.data.name, "✅");
    } catch (error) {
      console.log(error);
      table.addRow(file.split().pop().slice(0, -3), "❌");
    }
  });

  client.application.commands.set(commandsArray);
  // console.log(commandsArray);
  console.log(table.toString());
  console.info("\n\x1b[36m%s\x1b[0m", "loaded Commands");
}
module.exports = { loadCommands };
// const { loadFiles } = require("../Function/fileLoader");
// const ascii = require("ascii-table");
// const table = new ascii().setHeading("commands", "status");

// async function loadCommands(client) {
//   console.time("commands Loaded");
//   // await client.commands.clear();
//   client.commands = new Map();
//   client.devCommands = new Map();
//   const commands = new Array();

//   const files = await loadFiles("commands");
//   // const public = await loadFiles("commands/Public");
//   // const dev = await loadFiles("commands/Developer");

//   files.forEach((file) => {
//     try {
//       const command = require(file);
//       if (command.developer) {
//         client.devCommands.set(command.data.name, command);
//       } else {
//         client.commands.set(command.data.name, command);
//       }
//       commands.push({ command: command.data.name, Status: "✅" });
//     } catch (error) {
//       commands.push({
//         command: file.split("/").pop().slice(0, -3),
//         Status: "🛑",
//       });
//     }
//   });

//   console.table(commands, ["command", "Status"]);
//   console.info("\n\x1b[36m%s\x1b[0m", "loaded commands");
// }
