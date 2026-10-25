import defaults from "./config.default.ts";

const config = structuredClone(defaults);
config.server.host = process.env.NODELINK_SERVER_HOST ?? "0.0.0.0";
config.server.port = Number(process.env.NODELINK_SERVER_PORT ?? "3000");
config.server.password = process.env.NODELINK_SERVER_PASSWORD ?? "";

export default config;