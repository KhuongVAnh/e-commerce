const net = require("net");

const DEFAULT_REDIS_URL = "redis://localhost:6379";
const STARTUP_CHECK_TIMEOUT_MS = Number(process.env.STARTUP_CHECK_TIMEOUT_MS || 5000);

async function assertDatabaseLive(prisma, serviceName) {
  try {
    await prisma.$connect();
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log(`[${serviceName}] Database connection is live.`);
  } catch (error) {
    throw new Error(`[${serviceName}] Database is not live: ${formatError(error)}`);
  }
}

async function assertRedisLive(serviceName, redisUrl = process.env.REDIS_URL || DEFAULT_REDIS_URL) {
  try {
    await pingRedis(redisUrl, STARTUP_CHECK_TIMEOUT_MS);
    console.log(`[${serviceName}] Redis connection is live.`);
  } catch (error) {
    throw new Error(`[${serviceName}] Redis is not live: ${formatError(error)}`);
  }
}

function pingRedis(redisUrl, timeoutMs) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(redisUrl);
    const isTls = parsed.protocol === "rediss:";

    if (isTls) {
      reject(new Error("rediss:// is not supported by the startup TCP ping helper"));
      return;
    }

    const host = parsed.hostname || "localhost";
    const port = Number(parsed.port || 6379);
    const socket = net.createConnection({ host, port });
    let response = "";
    let settled = false;

    const timeout = setTimeout(() => {
      fail(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      socket.removeAllListeners();
      socket.destroy();
    }

    function done() {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve();
    }

    function fail(error) {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    }

    socket.on("connect", () => {
      const commands = [];
      const username = decodeURIComponent(parsed.username || "");
      const password = decodeURIComponent(parsed.password || "");

      if (password && username) {
        commands.push(serializeRedisCommand(["AUTH", username, password]));
      } else if (password) {
        commands.push(serializeRedisCommand(["AUTH", password]));
      }

      commands.push(serializeRedisCommand(["PING"]));
      socket.write(commands.join(""));
    });

    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");

      if (response.includes("-NOAUTH") || response.includes("-WRONGPASS") || response.includes("-ERR")) {
        fail(new Error(response.trim()));
        return;
      }

      if (response.includes("+PONG")) {
        done();
      }
    });

    socket.on("error", fail);
  });
}

function serializeRedisCommand(parts) {
  return `*${parts.length}\r\n${parts
    .map((part) => {
      const value = String(part);
      return `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
    })
    .join("")}`;
}

function formatError(error) {
  if (error instanceof Error) {
    const details = [];
    const nodeError = error;

    if (nodeError.code) {
      details.push(nodeError.code);
    }

    if (nodeError.address || nodeError.port) {
      details.push([nodeError.address, nodeError.port].filter(Boolean).join(":"));
    }

    if (error.message) {
      details.push(error.message);
    }

    if (details.length > 0) {
      return details.join(" ");
    }

    return error.message;
  }

  return String(error);
}

module.exports = {
  assertDatabaseLive,
  assertRedisLive,
};
