
import { Logger } from "./logger";
import { LogApiEntry } from "src/types/utils-types";

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