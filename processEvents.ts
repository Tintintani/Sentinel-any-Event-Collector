import logger from "./logger";
export async function processEvents(events: Object[], sourceType: string, sourceIp: string): Promise<Record<string,unknown>[]> {
    logger.info("Processing %d events", events.length);
    const processedEvents = events.map((event) => {
        return {
            Source: sourceType,
            SourceIp: sourceIp,
            Event: event,
        }
    });
    return processedEvents
}