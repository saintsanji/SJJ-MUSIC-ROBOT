import { config as loadDotenv } from "dotenv";

export interface AppConfig {
    discordToken: string;
    clientId: string;
    guildId?: string;
    nodeLinkHost: string;
    nodeLinkPort: number;
    nodeLinkPassword: string;
    nodeLinkSecure: boolean;
}

export function loadConfig(): AppConfig {
    loadDotenv();

    const requiredKeys = [
        "DISCORD_TOKEN",
        "CLIENT_ID",
        "NODELINK_HOST",
        "NODELINK_PORT",
        "NODELINK_PASS",
    ] as const;
    const missingKeys = requiredKeys.filter((key) => !process.env[key]?.trim());

    if (missingKeys.length > 0) {
        throw new Error(`Missing required environment variable(s): ${missingKeys.join(", ")}`);
    }

    const nodeLinkPort = Number(process.env.NODELINK_PORT);
    if (!Number.isInteger(nodeLinkPort) || nodeLinkPort < 1 || nodeLinkPort > 65535) {
        throw new Error("NODELINK_PORT must be an integer between 1 and 65535.");
    }

    const secureValue = process.env.NODELINK_SECURE?.toLowerCase() ?? "false";
    if (secureValue !== "true" && secureValue !== "false") {
        throw new Error('NODELINK_SECURE must be either "true" or "false".');
    }

    return {
        discordToken: process.env.DISCORD_TOKEN!,
        clientId: process.env.CLIENT_ID!,
        guildId: process.env.GUILD_ID?.trim() || undefined,
        nodeLinkHost: process.env.NODELINK_HOST!.trim(),
        nodeLinkPort,
        nodeLinkPassword: process.env.NODELINK_PASS!,
        nodeLinkSecure: secureValue === "true",
    };
}