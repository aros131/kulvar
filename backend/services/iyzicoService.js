import Iyzipay from "iyzipay";

// Constructed lazily — Iyzipay's constructor throws synchronously when keys are
// empty, which would crash the whole server at startup if built eagerly.
let _iyzipay = null;
function getClient() {
  if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
    throw new Error("iyzico API keys are not configured (IYZICO_API_KEY / IYZICO_SECRET_KEY)");
  }
  if (!_iyzipay) {
    _iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    });
  }
  return _iyzipay;
}

const splitName = (fullName) => {
  const parts = (fullName || "Müşteri").trim().split(/\s+/);
  const surname = parts.length > 1 ? parts.pop() : "Coaching";
  return { name: parts.join(" ") || "Müşteri", surname };
};

/**
 * Initializes an iyzico Checkout Form for the given payment/invoice.
 * iyzico requires buyer identity + address fields we don't collect from users yet;
 * sandbox-safe placeholders are used for those. Revisit before going live with real charges.
 */
export function createCheckoutForm({ payment, buyerUser, ip, callbackUrl }) {
  const { name, surname } = splitName(buyerUser.name);
  const price = Number(payment.amount).toFixed(2);

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: payment._id.toString(),
    price,
    paidPrice: price,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: payment._id.toString(),
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: buyerUser._id.toString(),
      name,
      surname,
      gsmNumber: "+905350000000",
      email: buyerUser.email,
      identityNumber: "11111111111",
      lastLoginDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      registrationDate: new Date(buyerUser.createdAt || Date.now()).toISOString().slice(0, 19).replace("T", " "),
      registrationAddress: "Bilinmiyor",
      ip: ip || "127.0.0.1",
      city: buyerUser.city || "Istanbul",
      country: "Turkey",
      zipCode: "34000",
    },
    shippingAddress: {
      contactName: buyerUser.name,
      city: buyerUser.city || "Istanbul",
      country: "Turkey",
      address: "Bilinmiyor",
      zipCode: "34000",
    },
    billingAddress: {
      contactName: buyerUser.name,
      city: buyerUser.city || "Istanbul",
      country: "Turkey",
      address: "Bilinmiyor",
      zipCode: "34000",
    },
    basketItems: [
      {
        id: payment._id.toString(),
        name: payment.description || "Koçluk Hizmeti",
        category1: "Coaching",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price,
      },
    ],
  };

  return new Promise((resolve, reject) => {
    getClient().checkoutFormInitialize.create(request, (err, result) => {
      if (err) return reject(err);
      if (result?.status !== "success") return reject(new Error(result?.errorMessage || "iyzico initialize failed"));
      resolve(result);
    });
  });
}

export function retrieveCheckoutForm({ token, conversationId }) {
  return new Promise((resolve, reject) => {
    getClient().checkoutForm.retrieve(
      { locale: Iyzipay.LOCALE.TR, token, conversationId },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}
