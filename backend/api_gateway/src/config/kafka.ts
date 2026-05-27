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
    clientId: "api-gateway-notification",
    brokers,
    ssl: sslConfig,
    sasl: saslConfig,
});
