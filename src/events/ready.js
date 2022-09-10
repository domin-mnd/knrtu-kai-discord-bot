const { Client } = require("discord.js");
const { blue, cyan, green } = require("chalk");

module.exports = {
    event: "ready",
    /**
     * @param {Client} client 
     */
    run: async (client) => {

        console.log(green("[READY]"), `${cyan(client.user.tag)} ${blue("Is Ready!")}`);
        client.user.setPresence({
            activities: [
                {
                    name: 'за КАИ',
                    type: 3
                }
            ],
            status: 'online'
        });
    }
}