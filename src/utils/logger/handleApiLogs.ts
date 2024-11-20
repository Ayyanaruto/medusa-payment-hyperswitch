
import { Logger } from "./logger";
import { LogApiEntry } from "src/types/utils-types";

/**
 * Handles API logs by logging them at different levels based on the status code.
 *
 * @param log - The log entry containing details about the API request and response.
 * @param log.status - The HTTP status code of the API response.
 * @param log.message - The log message.
 * @param log.error - Any error associated with the API request.
 * @param log.method - The HTTP method of the API request.
 * @param log.url - The URL of the API request.
 * @param log.responseTime - The time taken to get the API response.
 * @param log.requestBody - The body of the API request.
 * @param log.responseBody - The body of the API response.
 * @param log.headers - The headers of the API request.
 * @param log.source - The source of the log entry.
 */
export const handleApiLogs = (log: LogApiEntry) => {
    const logger = new Logger();
    if(log.status >= 500){
        logger.error(log.message,{
            error: log.error,
            status: log.status,
            method: log.method,
            url: log.url,
            responseTime: log.responseTime,
            requestBody: log.requestBody,
            responseBody: log.responseBody,
            headers: log.headers,


        }
        ,log.source);
    }
    else if(log.status >= 400){
        logger.warn(log.message,{
            error: log.error,
            status: log.status,
            method: log.method,
            url: log.url,
            responseTime: log.responseTime,
            requestBody: log.requestBody,
            responseBody: log.responseBody,
            headers: log.headers,


        }
        ,log.source);
    }
    else{
        logger.info(log.message,{
            error: log.error,
            status: log.status,
            method: log.method,
            url: log.url,
            responseTime: log.responseTime,
            requestBody: log.requestBody,
            responseBody: log.responseBody,
            headers: log.headers,


        }
        ,log.source);
    }

    };
