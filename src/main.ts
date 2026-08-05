import { App } from "./app.ts";
import { initSpeedInsights } from "./lib/speed-insights.ts";

const root = document.getElementById("app");
if (!root) throw new Error("#app not found");

const app = new App(root);
app.start();
initSpeedInsights();
