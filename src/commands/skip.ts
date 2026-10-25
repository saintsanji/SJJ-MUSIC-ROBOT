import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MusicBot } from "../index";

export default {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip the current song"),
    async execute(interaction: ChatInputCommandInteraction, client: MusicBot) {
        if (!interaction.guildId) return;

        const player = client.lavalink.getPlayer(interaction.guildId);

        if (!player || !player.playing) {
            return interaction.reply({ content: "There is nothing playing!", ephemeral: true });
        }

        const currentTrack = player.queue.current;
        await player.skip();

        return interaction.reply(`Skipped **${currentTrack?.info.title || "Unknown Title"}**`);
    }
};
