import { createApp } from "./app.mjs";
import { makePostgresOrderStore } from "./postgres.mjs";

const port = Number(process.env.PORT ?? 3000);
const store = process.env.DATABASE_URL
  ? makePostgresOrderStore(process.env.DATABASE_URL)
  : undefined;
if (store) await store.migrate();
const server = createApp({ store });
if (store) server.on("close", () => void store.close());
server.listen(port, "0.0.0.0", () => {
  process.stdout.write("Control Tower demo listening on port " + port + "\n");
});
