import { Client, GatewayIntentBits, Collection, Partials } from "discord.js";
import { LavalinkManager, NodeType, NodeLinkDefaultSources } from "lavalink-client";
import { readdirSync } from "fs";
import { join } from "path";
import { AppConfig, loadConfig } from "./config";

export class MusicBot extends Client {
    public lavalink: LavalinkManager;
    public commands = new Collection<string, any>();

    constructor(private readonly appConfig: AppConfig) {
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
                    authorization: appConfig.nodeLinkPassword,
                    host: appConfig.nodeLinkHost,
                    port: appConfig.nodeLinkPort,
                    secure: appConfig.nodeLinkSecure,
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
        console.log(`Loaded ${this.commands.size} slash commands: ${this.commands.map((command) => command.data.name).join(", ") || "none"}`);
        await this.login(this.appConfig.discordToken);
    }
}

async function main(): Promise<void> {
    const client = new MusicBot(loadConfig());
    client.on("error", (error) => console.error("Discord client error:", error));
    client.on("shardError", (error) => console.error("Discord gateway shard error:", error));

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
            const message = "There was an error while executing this command!";
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: message, ephemeral: true });
            } else {
                await interaction.reply({ content: message, ephemeral: true });
            }
        }
    });

    await client.start();
}

main().catch((error: unknown) => {
    console.error("Bot startup failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
