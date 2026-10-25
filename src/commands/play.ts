import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from "discord.js";
import { MusicBot } from "../index";
import { NodeType } from "lavalink-client";

export default {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song from YouTube or a link")
        .addStringOption(option => 
            option.setName("query")
                .setDescription("The song to play")
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction, client: MusicBot) {
        if (!interaction.guildId) return;
        
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: "You need to be in a voice channel to play music!", ephemeral: true });
        }

        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions?.has("Connect") || !permissions?.has("Speak")) {
            return interaction.reply({ content: "I need the permissions to join and speak in your voice channel!", ephemeral: true });
        }

        await interaction.deferReply();

        const query = interaction.options.getString("query", true);
        const node = [...client.lavalink.nodeManager.nodes.values()].find(
            (registeredNode) => registeredNode.nodeType === NodeType.NodeLink
        );

        if (!node?.isAlive) {
            return interaction.editReply(
                "NodeLink is not connected. Check that NODELINK_HOST and NODELINK_PORT point to the running instance and that it is reachable from the bot."
            );
        }

        let stage = "creating the player";
        try {
            const player = client.lavalink.createPlayer({
                guildId: interaction.guildId,
                voiceChannelId: voiceChannel.id,
                textChannelId: interaction.channelId,
                selfDeaf: true,
                selfMute: false,
                volume: 100
            });

            stage = "joining your voice channel";
            if (!player.connected) await player.connect();

            stage = "searching NodeLink";
            const res = await player.search({ query }, interaction.user);

            if (!res.tracks.length) {
                return interaction.editReply("No results found!");
            }

            if (res.loadType === "playlist") {
                for (const track of res.tracks) player.queue.add(track);
                await interaction.editReply(`Enqueued playlist **${res.playlist?.name}** with ${res.tracks.length} tracks.`);
            } else {
                player.queue.add(res.tracks[0]);
                await interaction.editReply(`Enqueued track **${res.tracks[0].info.title}**.`);
            }

            stage = "starting playback";
            if (!player.playing) await player.play();
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            console.error(`/play failed while ${stage}:`, error);
            return interaction.editReply(`Playback failed while ${stage}. ${detail}`);
        }
    }
};
