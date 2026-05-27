import { Kafka } from "kafkajs";
import fs from "fs";

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const ssl = process.env.KAFKA_SSL === "true";
const saslMechanism = process.env.KAFKA_SASL_MECHANISM;
const saslUsername = process.env.KAFKA_SASL_USERNAME;
const saslPassword = process.env.KAFKA_SASL_PASSWORD;

// SSL Certificates (optional, for cert-based auth)
const sslCaPath = process.env.KAFKA_SSL_CA_PATH;
const sslKeyPath = process.env.KAFKA_SSL_KEY_PATH;
const sslCertPath = process.env.KAFKA_SSL_CERT_PATH;

let sslConfig: any = ssl;
if (ssl && sslCaPath && sslKeyPath && sslCertPath) {
    try {
        sslConfig = {
            rejectUnauthorized: true,
            ca: [fs.readFileSync(sslCaPath, "utf-8")],
            key: fs.readFileSync(sslKeyPath, "utf-8"),
            cert: fs.readFileSync(sslCertPath, "utf-8"),
        };
    } catch (err) {
        console.error("[Kafka Config] Failed to read SSL certificate files:", err);
    }
}

const saslConfig = saslUsername && saslPassword
    ? {
        mechanism: (saslMechanism || "plain").toLowerCase() as any,
        username: saslUsername,
        password: saslPassword,
    }
    : undefined;

export const kafka = new Kafka({
    clientId: "auth-service",
    brokers,
    ssl: sslConfig,
    sasl: saslConfig,
});

const producer = kafka.producer();

let isConnected = false;

export async function publishEvent(topic: string, payload: any): Promise<void> {
    try {
        if (!isConnected) {
            await producer.connect();
            isConnected = true;
            console.log("[Kafka Producer] Connected successfully in auth_service.");
        }

        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(payload) }
            ]
        });
        console.log(`[Kafka Producer] Published event to topic [${topic}]:`, JSON.stringify(payload));
    } catch (error) {
        console.error(`[Kafka Producer] Failed to publish event to topic [${topic}]:`, error);
    }
}
