import { MusicBot } from "../index";
import { Events } from "discord.js";

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: MusicBot) {
        console.log(`Logged in as ${client.user?.tag}!`);
        
        // Initialize lavalink client
        await client.lavalink.init({
            id: client.user?.id || "",
            username: client.user?.username || "MusicBot"
        });
        
        console.log("Lavalink initialized.");
    }
};
