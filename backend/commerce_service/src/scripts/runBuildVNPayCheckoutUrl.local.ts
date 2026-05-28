import { buildVNPayCheckoutUrl, type CreateVNPayUrlInput } from "../services/paymentService";

function run(): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const input: CreateVNPayUrlInput = {
        orderCode: `LOCAL_TEST_${Date.now()}`,
        amount: 150000,
        ipAddr: "127.0.0.1",
    };

    const url = buildVNPayCheckoutUrl(input, now, expiresAt);

    console.log("VNPay checkout URL:");
    console.log(url);
}

run();
// npx ts-node --transpile-only src/scripts/runBuildVNPayCheckoutUrl.local.ts