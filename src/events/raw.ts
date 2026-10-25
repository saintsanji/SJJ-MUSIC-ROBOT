import { MusicBot } from "../index";

export default {
    name: "raw",
    execute(client: MusicBot, data: any) {
        client.lavalink.sendRawData(data);
    }
};
