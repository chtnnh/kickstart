import { App } from "./app.ts";

const root = document.getElementById("app");
if (!root) throw new Error("#app not found");

const app = new App(root);
void app.start();
