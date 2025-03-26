# Sentinel Any Event Collector

An applicatin built to ingest any type of raw logs into Sentinel Workspace over HTTPS using the Log Ingestion API. Similar to the HTTP Event Collector from Splunk [Documentation](https://docs.splunk.com/Documentation/Splunk/9.4.1/Data/ShareHECData)

## Features

-   **Authentication**: JWT-based authentication for secure access.
-   **Log Ingestion**: Accepts any type of raw logs and ingests them into your workspace.
-   **Sentinel Integration**: Supports Microsoft Sentinel ingestion using the Log Ingestion API.

---

## Installation

1. Ensure Node.js v22 is installed on your system
2. Clone the repository
3. Install dependencies:

    ```bash
    npm ci
    ```

4. Install Devtunnel to host your localhost server using reverse proxy. [Guide](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started?tabs=macos)

## Prerequisites

1. Deploy the templates for DCE, DCR, Table. [Template](/mainTemplate.json)
2. Copy the Log Ingestion Endpoint and the Immuatable Id for the deployed DCE and DCR respectively.

## Running the Platform

1. Initialise reverse proxy to `localhost:3000`

    ```bash
    npm run devtunnel
    ```

2. Configuring Environment Variables
   Create a `.env` file and add the following variables with the values copied earlier\
   `DCE_URL`\
   `DCR_RULE_ID`

3. Start the Application

    ```bash
    npm run start
    ```

4. Make a POST request to the `/login` endpoint to get the token with the following credentials in the body

    ```json
    {
        "username": "admin",
        "password": "passowrd"
    }
    ```

5. Send Logs by making POST request to the `/data?sourceType={sourceName}` endpoint to ingest data. Source name is the name to be tagged with the logs when ingesting, defaults to Custom.\
   Headers:

    ```json
    {
        "Authentication": "Bearer {token}"
    }
    ```

    Body:

    ```json
    [
        {
            "timestamp": "2025-03-26T12:34:56Z",
            "level": "error",
            "message": "Database connection failed",
            "service": "user-auth-service",
            "error": {
                "code": "DB_CONN_TIMEOUT",
                "details": "Connection to database timed out after 30 seconds"
            }
        },
        {
            "timestamp": "2025-03-26T14:20:10Z",
            "level": "error",
            "message": "Failed to fetch user details",
            "service": "user-profile-service",
            "error": {
                "code": "USER_NOT_FOUND",
                "details": "No user found with the given ID"
            }
        }
    ]
    ```
