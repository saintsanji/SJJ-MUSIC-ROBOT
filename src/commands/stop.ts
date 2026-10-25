import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MusicBot } from "../index";

export default {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stop the music and leave the voice channel"),
    async execute(interaction: ChatInputCommandInteraction, client: MusicBot) {
        if (!interaction.guildId) return;

        const player = client.lavalink.getPlayer(interaction.guildId);

        if (!player) {
            return interaction.reply({ content: "There is no player to stop!", ephemeral: true });
        }

        player.queue.tracks.splice(0, player.queue.tracks.length);
        await player.destroy();

        return interaction.reply("Stopped the music and left the voice channel.");
    }
};
