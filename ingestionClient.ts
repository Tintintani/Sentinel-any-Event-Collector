import { processEvents } from "./processEvents";
import logger from "./logger";
import { DefaultAzureCredential } from "@azure/identity";
import { isAggregateLogsUploadError, LogsIngestionClient } from "@azure/monitor-ingestion";

export class IngestionClient {
    private client: LogsIngestionClient;
    private credential: DefaultAzureCredential;
    private dceUrl: string;
    private dcrRuleId: string;

    constructor(dceurl: string, dcrRuleId: string) {
        this.dceUrl = dceurl;
        this.dcrRuleId = dcrRuleId;
        this.credential = new DefaultAzureCredential();
        this.client = new LogsIngestionClient(this.dceUrl, this.credential);
    }

    public async ingest(data: Object[], sourceType: string, sourceIp: string): Promise<void> {
        const processedEvents = await processEvents(data, sourceType, sourceIp);
        logger.info("Ingesting %d events", processedEvents.length);

        if (processedEvents.length === 0) {
            logger.warn("No events to ingest");
            return;
        }

        await this.client.upload(this.dcrRuleId, "Custom-RawEventIngestionSentinel", processedEvents, { maxConcurrency: 5 }).then(() =>{
            logger.info("Ingested %d logs", processedEvents.length);
        }).catch((e) => {
            const aggregateErrors = isAggregateLogsUploadError(e) ? e.errors : [];
            if (aggregateErrors.length > 0) {
                logger.warn("Some logs have failed to complete ingestion");
                for (const error of aggregateErrors) {
                    logger.error(error);
                }
            } else {
                logger.error(e);
            }
        });
        
    }
}
