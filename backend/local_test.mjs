import { Buffer } from "buffer";
import crypto from "crypto";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:3000";
const AUTH_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const CATALOG_URL = process.env.CATALOG_SERVICE_URL || "http://localhost:3002";
const COMMERCE_URL = process.env.COMMERCE_SERVICE_URL || "http://localhost:3003";

const VNP_HASH_SECRET = "HRQHV5NUWC27Q3CG5IU554RCJSY9NFDL";

// ANSI escape codes for coloring
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
};

function logInfo(msg) {
  console.log(`${COLORS.cyan}[INFO]${COLORS.reset} ${msg}`);
}

function logPass(msg) {
  console.log(`${COLORS.green}[PASS]${COLORS.reset} ${msg}`);
}

function logWarn(msg) {
  console.log(`${COLORS.yellow}[WARN]${COLORS.reset} ${msg}`);
}

function logFail(msg) {
  console.error(`${COLORS.red}[FAIL]${COLORS.reset} ${msg}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for parsing set-cookie header in fetch
function getCookieValue(headers, name) {
  let cookies = [];
  if (typeof headers.getSetCookie === 'function') {
    cookies = headers.getSetCookie();
  } else {
    const raw = headers.get('set-cookie');
    if (raw) {
      cookies = raw.split(/,\s*/);
    }
  }
  for (const cookie of cookies) {
    const [pair] = cookie.split(';');
    const [cName, cVal] = pair.split('=');
    if (cName.trim() === name) {
      return cVal.trim();
    }
  }
  return null;
}

// Global test variables
let customerToken = null;
let customerRefreshToken = null;
let sellerToken = null;
let adminToken = null;

let shopId = null;
let categoryId = null;
let productId = null;
let cartItemId = null;
let orderId = null;
let orderCode = null;
let vnpayOrderCode = null;
let vnpayOrderId = null;

async function httpJson(url, init = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };

  const res = await fetch(url, {
    ...init,
    headers,
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return {
    status: res.status,
    ok: res.ok,
    body,
    headers: res.headers,
  };
}

async function waitForServices(retries = 30) {
  const services = [
    { name: "API Gateway", url: `${GATEWAY_URL}/health` },
    { name: "Auth Service", url: `${AUTH_URL}/health` },
    { name: "Catalog Service", url: `${CATALOG_URL}/health` },
    { name: "Commerce Service", url: `${COMMERCE_URL}/health` },
  ];

  logInfo("Waiting for all microservices to be healthy...");
  for (const service of services) {
    let success = false;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { status, body } = await httpJson(service.url);
        if (status === 200 && (body?.status === "ok" || body?.service)) {
          logPass(`${service.name} is healthy!`);
          success = true;
          break;
        }
      } catch (e) {
        // Ignored, retry
      }
      await sleep(2000);
    }
    if (!success) {
      throw new Error(`Timeout waiting for service: ${service.name}`);
    }
  }
}

function buildVNPayReturnQuery(orderCode, amount, hashSecret) {
  const vnpParams = {
    vnp_Amount: String(amount * 100),
    vnp_BankCode: "NCB",
    vnp_BankTranNo: `VNP${Date.now()}`,
    vnp_CardType: "ATM",
    vnp_OrderInfo: `Thanh toan don hang ${orderCode}`,
    vnp_PayDate: "20260524232300",
    vnp_ResponseCode: "00",
    vnp_TmnCode: "KJPX5OMG",
    vnp_TransactionNo: `TRANS-${Date.now()}`,
    vnp_TransactionStatus: "00",
    vnp_TxnRef: orderCode,
  };

  const sorted = {};
  const keys = Object.keys(vnpParams).sort();
  for (const k of keys) {
    sorted[k] = encodeURIComponent(vnpParams[k]).replace(/%20/g, "+");
  }

  const signData = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const hmac = crypto.createHmac("sha512", hashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return signData + `&vnp_SecureHash=${signed}`;
}

async function runTests() {
  const emailSuffix = Date.now();
  const customerEmail = `cust.${emailSuffix}@cnweb.local`;
  const sellerEmail = `sell.${emailSuffix}@cnweb.local`;
  const defaultPassword = "123456";

  let passedTests = 0;
  let failedTests = 0;

  async function assertTest(name, fn) {
    try {
      logInfo(`Running: ${name}`);
      await fn();
      logPass(`SUCCESS: ${name}`);
      passedTests++;
    } catch (error) {
      logFail(`FAILED: ${name}`);
      console.error(error);
      failedTests++;
    }
    console.log("-".repeat(60));
  }

  // ==========================================
  // 1. AUTH FLOWS
  // ==========================================
  await assertTest("Register Customer", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({
        email: customerEmail,
        password: defaultPassword,
        fullName: "Test Customer",
        role: "CUSTOMER",
      }),
    });
    if (status !== 201) {
      throw new Error(`Register failed with status ${status}: ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Register Seller", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({
        email: sellerEmail,
        password: defaultPassword,
        fullName: "Test Seller",
        role: "SELLER",
      }),
    });
    if (status !== 201) {
      throw new Error(`Register failed with status ${status}: ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Login Customer", async () => {
    const { status, body, headers } = await httpJson(`${GATEWAY_URL}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        email: customerEmail,
        password: defaultPassword,
      }),
    });
    if (status !== 200) {
      throw new Error(`Login failed with status ${status}: ${JSON.stringify(body)}`);
    }
    customerToken = body?.data?.tokens?.accessToken;
    customerRefreshToken = getCookieValue(headers, "refreshToken");
    if (!customerToken) throw new Error("Missing customer accessToken in response body");
    if (!customerRefreshToken) throw new Error("Missing customer refreshToken in cookies");
  });

  await assertTest("Login Seller", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        email: sellerEmail,
        password: defaultPassword,
      }),
    });
    if (status !== 200) {
      throw new Error(`Login failed with status ${status}: ${JSON.stringify(body)}`);
    }
    sellerToken = body?.data?.tokens?.accessToken;
    if (!sellerToken) throw new Error("Missing seller accessToken in response body");
  });

  await assertTest("Login Seeded Admin", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "admin@cnweb.local",
        password: "123456",
      }),
    });
    if (status !== 200) {
      throw new Error(`Login failed with status ${status}: ${JSON.stringify(body)}`);
    }
    adminToken = body?.data?.tokens?.accessToken;
    if (!adminToken) throw new Error("Missing admin accessToken in response body");
  });

  await assertTest("Auth Get Me (Customer)", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (status !== 200 || body?.data?.user?.email !== customerEmail) {
      throw new Error(`Get Me failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Auth Token Refresh", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refreshToken=${customerRefreshToken}` },
    });
    if (status !== 200 || !body?.data?.tokens?.accessToken) {
      throw new Error(`Token Refresh failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Auth Logout", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${customerToken}`,
        Cookie: `refreshToken=${customerRefreshToken}`,
      },
    });
    if (status !== 200) {
      throw new Error(`Logout failed: status ${status}, body ${JSON.stringify(body)}`);
    }
    // Log back in to get a valid token for other tests
    const relogin = await httpJson(`${GATEWAY_URL}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        email: customerEmail,
        password: defaultPassword,
      }),
    });
    customerToken = relogin.body?.data?.tokens?.accessToken;
  });

  // ==========================================
  // 2. UPLOAD FLOW
  // ==========================================
  await assertTest("Upload Image (Expect success or Cloudinary dummy fail)", async () => {
    const formData = new FormData();
    const blob = new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64")], { type: "image/png" });
    formData.append("image", blob, "pixel.png");

    const res = await fetch(`${GATEWAY_URL}/api/uploads/images`, {
      method: "POST",
      body: formData,
    });
    const status = res.status;
    const responseBody = await res.json().catch(() => null);

    if (status === 201) {
      logPass("Upload succeeded!");
    } else if (status === 500 && JSON.stringify(responseBody).toLowerCase().includes("cloudinary")) {
      logWarn("Upload API returned 500 as expected due to dummy/missing CLOUDINARY_URL credentials.");
    } else {
      throw new Error(`Upload failed with status ${status}: ${JSON.stringify(responseBody)}`);
    }
  });

  // ==========================================
  // 3. SHOP FLOWS
  // ==========================================
  await assertTest("Register Shop", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/shops`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        name: `Shop-${emailSuffix}`,
        address: "456 Seller Lane, Hanoi",
        description: "Standard Test Shop Description",
      }),
    });
    if (status !== 201) {
      throw new Error(`Register shop failed with status ${status}: ${JSON.stringify(body)}`);
    }
    shopId = body?.data?.shop?.id;
    if (!shopId) throw new Error("Missing shop ID in register response");
  });

  await assertTest("Get My Shop", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/shops/my-shop`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    if (status !== 200 || body?.data?.shop?.id !== shopId) {
      throw new Error(`Get My Shop failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Update My Shop", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/shops/my-shop`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        description: "Updated shop description",
        address: "789 New Seller St",
      }),
    });
    if (status !== 200 || body?.data?.shop?.description !== "Updated shop description") {
      throw new Error(`Update Shop failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Get Shop Internal By Seller ID", async () => {
    // Extract seller ID from token (or since it's an internal test, look it up)
    const meRes = await httpJson(`${GATEWAY_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const sellerId = meRes.body?.data?.user?.id;
    if (!sellerId) throw new Error("Could not retrieve seller ID for internal check");

    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/shops/internal/by-seller/${sellerId}`);
    if (status !== 200 || body?.data?.shop?.id !== shopId) {
      throw new Error(`Internal Shop lookup failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  // ==========================================
  // 4. CATEGORY FLOWS
  // ==========================================
  await assertTest("Create Category", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/categories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Category-${emailSuffix}`,
        status: "ACTIVE",
      }),
    });
    if (status !== 201) {
      throw new Error(`Create Category failed: status ${status}, body ${JSON.stringify(body)}`);
    }
    categoryId = body?.data?.category?.id;
    if (!categoryId) throw new Error("Missing category ID in create response");
  });

  await assertTest("Get Categories List", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/categories`);
    if (status !== 200 || !Array.isArray(body?.data)) {
      throw new Error(`Get Categories failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Update Category", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/categories/${categoryId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Updated-Category-${emailSuffix}`,
      }),
    });
    if (status !== 200 || body?.data?.category?.name !== `Updated-Category-${emailSuffix}`) {
      throw new Error(`Update Category failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Create & Delete Temp Category (Testing Delete)", async () => {
    const create = await httpJson(`${GATEWAY_URL}/api/catalog/categories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: `Temp-${emailSuffix}` }),
    });
    const tempId = create.body?.data?.category?.id;
    if (!tempId) throw new Error("Failed to create temp category");

    const del = await httpJson(`${GATEWAY_URL}/api/catalog/categories/${tempId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (del.status !== 200) {
      throw new Error(`Delete Category failed with status ${del.status}: ${JSON.stringify(del.body)}`);
    }
  });

  // ==========================================
  // 5. PRODUCT FLOWS
  // ==========================================
  await assertTest("Create Product", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        shopId: Number(shopId),
        categoryId: Number(categoryId),
        name: `Product-${emailSuffix}`,
        price: 150000,
        stockQuantity: 100,
        thumbnailUrl: "https://picsum.photos/seed/test/800/800",
        status: "ACTIVE",
      }),
    });
    if (status !== 201) {
      throw new Error(`Create Product failed: status ${status}, body ${JSON.stringify(body)}`);
    }
    productId = body?.data?.product?.id;
    if (!productId) throw new Error("Missing product ID in create response");
  });

  await assertTest("Get Product Detail", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/products/${productId}`);
    if (status !== 200 || body?.data?.product?.id !== productId) {
      throw new Error(`Get Product Detail failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("List Public Products", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/products?keyword=Product-${emailSuffix}`);
    if (status !== 200 || body?.data?.length === 0) {
      throw new Error(`List Products failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Update Product Info", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/products/${productId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        price: 180000,
        description: "New updated product description",
      }),
    });
    if (status !== 200 || Number(body?.data?.product?.price) !== 180000) {
      throw new Error(`Update Product failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Update Product Stock (PATCH)", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/products/${productId}/stock`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        stockQuantity: 200,
      }),
    });
    if (status !== 200 || body?.data?.currentStock !== 200) {
      throw new Error(`Update Stock failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Internal Product Decrement Stock", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/internal/products/decrement-stock`, {
      method: "POST",
      body: JSON.stringify({
        items: [{ productId: Number(productId), quantity: 10 }],
      }),
    });
    if (status !== 200 || body?.success !== true || body?.data?.[0]?.id !== productId) {
      throw new Error(`Internal decrement failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Internal Product Increment Stock", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/internal/products/increment-stock`, {
      method: "POST",
      body: JSON.stringify({
        items: [{ productId: Number(productId), quantity: 10 }],
      }),
    });
    if (status !== 200 || body?.success !== true || body?.data?.[0]?.id !== productId) {
      throw new Error(`Internal increment failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("List Products By IDs", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/catalog/products/by-ids`, {
      method: "POST",
      body: JSON.stringify({
        productIds: [Number(productId)],
      }),
    });
    if (status !== 200 || body?.data?.products?.[0]?.id !== productId) {
      throw new Error(`List by IDs failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  // ==========================================
  // 6. CART FLOWS
  // ==========================================
  await assertTest("Add Item To Cart", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/cart/items`, {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        productId: Number(productId),
        quantity: 5,
      }),
    });
    if (status !== 201) {
      throw new Error(`Add to cart failed: status ${status}, body ${JSON.stringify(body)}`);
    }
    cartItemId = body?.data?.id;
    if (!cartItemId) throw new Error("Missing cart item ID in add-to-cart response");
  });

  await assertTest("Get Cart", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (status !== 200 || body?.data?.totalQuantity === 0) {
      throw new Error(`Get Cart failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Update Cart Item Quantity", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/cart/items/${cartItemId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        quantity: 3,
      }),
    });
    if (status !== 200 || body?.data?.quantity !== 3) {
      throw new Error(`Update Cart Item failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Checkout Preview", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/cart/checkout-preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        shopId: String(shopId),
        cartItemIds: [String(cartItemId)],
      }),
    });
    if (status !== 200 || body?.data?.canCheckout !== true) {
      throw new Error(`Checkout preview failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  // ==========================================
  // 7. ORDER FLOWS (COD & VNPAY)
  // ==========================================
  await assertTest("Checkout COD Order", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/orders/checkout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        shopId: String(shopId),
        cartItemIds: [String(cartItemId)],
        paymentMethod: "COD",
        receiverName: "Test Customer",
        receiverPhone: "0901234567",
        receiverAddress: "123 Test Street, Hanoi",
      }),
    });
    if (status !== 201) {
      throw new Error(`COD Checkout failed: status ${status}, body ${JSON.stringify(body)}`);
    }
    orderId = body?.data?.orderId;
    orderCode = body?.data?.orderCode;
    if (!orderId || !orderCode) throw new Error("Missing orderId or orderCode in checkout response");
  });

  await assertTest("Cancel Order", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/orders/${orderCode}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (status !== 200 || body?.data?.orderStatus !== "CANCELLED") {
      throw new Error(`Cancel order failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  // Let's add back items to cart for VNPAY checkout
  await assertTest("Add Item To Cart (Again for VNPAY)", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/cart/items`, {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        productId: Number(productId),
        quantity: 2,
      }),
    });
    if (status !== 201) {
      throw new Error(`Add to cart failed: status ${status}, body ${JSON.stringify(body)}`);
    }
    cartItemId = body?.data?.id;
  });

  await assertTest("Checkout VNPAY Order", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/orders/checkout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        shopId: String(shopId),
        cartItemIds: [String(cartItemId)],
        paymentMethod: "VNPAY",
        receiverName: "Test Customer",
        receiverPhone: "0901234567",
        receiverAddress: "123 Test Street, Hanoi",
      }),
    });
    if (status !== 201) {
      throw new Error(`VNPAY Checkout failed: status ${status}, body ${JSON.stringify(body)}`);
    }
    vnpayOrderCode = body?.data?.orderCode;
    vnpayOrderId = body?.data?.orderId;
    if (!vnpayOrderCode) throw new Error("Missing orderCode in VNPAY checkout response");
    if (!vnpayOrderId) throw new Error("Missing orderId in VNPAY checkout response");
    if (!body?.data?.paymentUrl) throw new Error("Missing paymentUrl in VNPAY checkout response");
  });

  await assertTest("Get Payment URL by Order Code", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/orders/${vnpayOrderCode}/payment-url`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (status !== 200 || !body?.data?.paymentUrl) {
      throw new Error(`Get Payment URL failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Get Order Details", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/orders/${vnpayOrderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (status !== 200 || body?.data?.order?.orderCode !== vnpayOrderCode) {
      throw new Error(`Get Order Details failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Get My Orders List", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/orders/my`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (status !== 200 || !Array.isArray(body?.data?.orders)) {
      throw new Error(`Get My Orders failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  // ==========================================
  // 8. SELLER ORDER FLOW
  // ==========================================
  await assertTest("Seller Get Orders List", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/seller/orders`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    if (status !== 200 || !Array.isArray(body?.data?.orders)) {
      throw new Error(`Seller Get Orders failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  // ==========================================
  // 9. PAYMENT IPN & CHECK FLOW
  // ==========================================
  await assertTest("Mock VNPay Return Callback (IPN)", async () => {
    // Generate valid HMAC signed query params for checkout price (2 items * 180000 + 30000 ship = 390000)
    const queryStr = buildVNPayReturnQuery(vnpayOrderCode, 390000, VNP_HASH_SECRET);

    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/payments/vnpay-return?${queryStr}`);
    if (status !== 200 || body?.RspCode !== "00") {
      throw new Error(`VNPay Return callback failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Verify VNPay check-result (Public)", async () => {
    const queryStr = buildVNPayReturnQuery(vnpayOrderCode, 390000, VNP_HASH_SECRET);

    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/payments/check-result?${queryStr}`);
    if (status !== 200 || body?.data?.result?.isPaid !== true) {
      throw new Error(`Verify check-result failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Verify order check-result (Customer)", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/orders/${vnpayOrderCode}/check-result`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (status !== 200 || body?.data?.result?.isPaid !== true) {
      throw new Error(`Verify order check-result failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  await assertTest("Seller Update Order Status (Transition to SHIPPING)", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/commerce/seller/orders/${vnpayOrderId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        status: "SHIPPING",
      }),
    });
    if (status !== 200 || body?.data?.order?.orderStatus !== "SHIPPING") {
      throw new Error(`Seller Update Order Status failed: status ${status}, body ${JSON.stringify(body)}`);
    }
  });

  // ==========================================
  // 10. NOTIFICATION FLOW
  // ==========================================
  await assertTest("Get Notifications", async () => {
    const { status, body } = await httpJson(`${GATEWAY_URL}/api/notifications/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (status !== 200) {
      throw new Error(`Get Notifications failed: status ${status}, body ${JSON.stringify(body)}`);
    }
    logInfo(`Number of notifications retrieved: ${body?.data?.notifications?.length || 0}`);
    const firstNotif = body?.data?.notifications?.[0];
    if (firstNotif) {
      const markRead = await httpJson(`${GATEWAY_URL}/api/notifications/${firstNotif.id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (markRead.status !== 200 || markRead.body?.data?.notification?.isRead !== true) {
        throw new Error(`Mark Notification As Read failed: status ${markRead.status}, body ${JSON.stringify(markRead.body)}`);
      }
      logPass("Successfully marked notification as read.");
    }
  });

  // ==========================================
  // TEARDOWN / CLEANUP
  // ==========================================
  await assertTest("Cleanup Created Products & Categories", async () => {
    // Delete product
    const delProduct = await httpJson(`${GATEWAY_URL}/api/catalog/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    if (delProduct.status !== 200) {
      logWarn(`Could not delete test product: status ${delProduct.status}`);
    }

    // Delete category
    const delCategory = await httpJson(`${GATEWAY_URL}/api/catalog/categories/${categoryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (delCategory.status !== 200) {
      logWarn(`Could not delete test category: status ${delCategory.status}`);
    }
  });

  console.log("\n" + "="*40);
  console.log(`${COLORS.bold}API TEST SUITE SUMMARY:${COLORS.reset}`);
  console.log(`${COLORS.green}PASSED TESTS: ${passedTests}${COLORS.reset}`);
  if (failedTests > 0) {
    console.log(`${COLORS.red}FAILED TESTS: ${failedTests}${COLORS.reset}`);
    process.exit(1);
  } else {
    console.log(`${COLORS.green}ALL TESTS PASSED SUCCESSFULLY!${COLORS.reset}`);
    process.exit(0);
  }
}

async function main() {
  try {
    await waitForServices();
    await runTests();
  } catch (error) {
    logFail(`Test runner aborted: ${error.message}`);
    process.exit(1);
  }
}

main();
