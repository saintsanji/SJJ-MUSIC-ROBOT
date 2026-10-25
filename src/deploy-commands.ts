import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { loadConfig } from "./config";

const commands = [];
const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = require(filePath).default;
    if (command && command.data) {
        commands.push(command.data.toJSON());
    }
}

const appConfig = loadConfig();
const rest = new REST({ version: "10" }).setToken(appConfig.discordToken);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const route = appConfig.guildId
            ? Routes.applicationGuildCommands(appConfig.clientId, appConfig.guildId)
            : Routes.applicationCommands(appConfig.clientId);
        const data: any = await rest.put(route, { body: commands });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
