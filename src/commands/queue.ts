import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { MusicBot } from "../index";

export default {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Show the current queue"),
    async execute(interaction: ChatInputCommandInteraction, client: MusicBot) {
        if (!interaction.guildId) return;

        const player = client.lavalink.getPlayer(interaction.guildId);

        if (!player) {
            return interaction.reply({ content: "There is no player for this guild!", ephemeral: true });
        }

        const current = player.queue.current;
        const tracks = player.queue.tracks.slice(0, 10); // Show first 10 tracks

        const embed = new EmbedBuilder()
            .setTitle(`Queue for ${interaction.guild?.name}`)
            .setColor("Blue");

        if (current) {
            embed.addFields({ name: "Currently Playing", value: `[${current.info.title}](${current.info.uri})` });
        }

        if (tracks.length) {
            embed.addFields({ 
                name: "Upcoming", 
                value: tracks.map((track, i) => `${i + 1}. [${track.info.title}](${track.info.uri})`).join("\n") 
            });
        } else {
            embed.setDescription("The queue is empty.");
        }

        return interaction.reply({ embeds: [embed] });
    }
};
