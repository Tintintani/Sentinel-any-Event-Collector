import { SharedServer } from "./server";
import { IngestionClient } from "./ingestionClient";
import "dotenv/config";

const dceUrl = process.env.DCE_URL
const dcrRuleId = process.env.DCR_RULE_ID

if (!dceUrl) {
  throw new Error("DCE_URL is not set in the environment variables.");
}

if (!dcrRuleId) {
    throw new Error("DCR_RULE_ID is not set in the environment variables.");
}

const ingestionClient = new IngestionClient(dceUrl, dcrRuleId);
const sharedServer = new SharedServer();
sharedServer.start(ingestionClient);
