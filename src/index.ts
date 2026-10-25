import { Client, GatewayIntentBits, Collection, Partials } from "discord.js";
import { LavalinkManager, NodeType, NodeLinkDefaultSources } from "lavalink-client";
import { config } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";

config();

export class MusicBot extends Client {
    public lavalink: LavalinkManager;
    public commands = new Collection<string, any>();

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
            partials: [Partials.Channel]
        });

        this.lavalink = new LavalinkManager({
            nodes: [
                {
                    authorization: process.env.NODELINK_PASS ?? "",
                    host: process.env.NODELINK_HOST ?? "",
                    port: Number(process.env.NODELINK_PORT),
                    secure: process.env.NODELINK_SECURE === "true",
                    nodeType: NodeType.NodeLink,
                }
            ],
            sendToShard: (guildId, payload) => {
                const guild = this.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            },
            autoSkip: true,
            playerOptions: {
                clientBasedPositionUpdateInterval: 150,
                defaultSearchPlatform: "ytsearch",
                onDisconnect: {
                    destroyPlayer: true
                },
                onEmptyQueue: {
                    destroyAfterMs: 0
                }
            }
        });

        this.lavalink.utils.SourcesRecord = NodeLinkDefaultSources as typeof this.lavalink.utils.SourcesRecord;
        this.lavalink.nodeManager.on("connect", (node) => {
            console.log(`Connected to NodeLink node ${node.options.host}:${node.options.port}.`);
        });
        this.lavalink.nodeManager.on("error", (node, error) => {
            console.error(`NodeLink node ${node.options.host}:${node.options.port} error:`, error.message);
        });

        this.loadCommands();
        this.loadEvents();
    }

    private loadCommands() {
        const commandsPath = join(__dirname, "commands");
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const command = require(filePath).default;
            if (command && command.data) {
                this.commands.set(command.data.name, command);
            }
        }
    }

    private loadEvents() {
        const eventsPath = join(__dirname, "events");
        const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

        for (const file of eventFiles) {
            const filePath = join(eventsPath, file);
            const event = require(filePath).default;
            if (event.once) {
                this.once(event.name, (...args) => event.execute(this, ...args));
            } else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            }
        }
    }

    public async start() {
        if (!process.env.DISCORD_TOKEN) {
            throw new Error("DISCORD_TOKEN is missing from the environment.");
        }

        console.log(`Loaded ${this.commands.size} slash commands: ${this.commands.map((command) => command.data.name).join(", ") || "none"}`);
        await this.login(process.env.DISCORD_TOKEN);
    }
}

const client = new MusicBot();
client.on("error", (error) => console.error("Discord client error:", error));
client.on("shardError", (error) => console.error("Discord gateway shard error:", error));
client.start().catch((error) => {
    console.error("Bot login failed:", error);
    process.exitCode = 1;
});

// Handle interaction for slash commands
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.warn(`Received unregistered command interaction: /${interaction.commandName}`);
        return;
    }

    console.log(`Executing /${interaction.commandName} in guild ${interaction.guildId ?? "DM"}`);

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
        } else {
            await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
});
