const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 綠界提供的 SDK
const ecpay_payment = require("ecpay_aio_nodejs");

const { MERCHANTID, HASHKEY, HASHIV, HOST, FRONTEND_URL } = process.env;

// 初始化
const options = {
  OperationMode: "Test",
  MercProfile: {
    MerchantID: MERCHANTID,
    HashKey: HASHKEY,
    HashIV: HASHIV,
  },
  IgnorePayment: [],
  IsProjectContractor: false,
};

const app = express();

app.use(cors()); // 允許前端跨域呼叫
app.use(express.json()); // 解析 JSON 格式的請求
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Payment Server is running!");
});

// 測試用的 API，確認伺服器運作正常
app.get("/test", (req, res) => {
  res.json({ message: "測試成功！" });
});

// 前端送訂單資料夾，建立金流訂單 (前端送訂單資料過來，後端這邊產生 ECPay 付款表單)
app.post("/pay", (req, res) => {
  const orderData = req.body;
  const TradeNo = "COFF" + new Date().getTime(); // 產生唯一的訂單編號

  // 產生交易時間，格式 yyyy/MM/dd HH:mm:ss
  const MerchantTradeDate = new Date().toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Taipei",
  });

  // 給綠界的參數
  const baseParam = {
    MerchantTradeNo: TradeNo,
    MerchantTradeDate,
    TotalAmount: "100", // 先寫死，實際上應該從前端傳過來
    TradeDesc: "咖啡店訂單", // 先寫死，實際上應該從前端傳過來
    ItemName: "咖啡", // 先寫死，實際上應該從前端傳過來
    ReturnURL: `${HOST}/payment-callback`, // 綠界付款完成後會呼叫這個 URL
    ClientBackURL: `${FRONTEND_URL}/checkout`, // 付款後跳轉前端
  };

  // 用 SDK 產生 HTML 表單
  const create = new ecpay_payment(options);
  const html = create.payment_client.aio_check_out_all(baseParam);

  res.send(html); // 回傳 HTML 給前端，前端會自動跳轉到綠界付款頁面
});

// ECPay 付款完成後回調（Webhook）
app.post("/payment-callback", (req, res) => {
  const callbackData = req.body;
  console.log("收到付款回調：", callbackData);
});

// 使用者付款後被重導向回來的頁面
app.get("/payment-return", (req, res) => {
  const returnData = req.query; // 從 URL 查詢參數接收資料
  console.log("收到付款回傳：", returnData);
});

app.listen(3000, () => {
  console.log("伺服器正在聆聽 port 3000...");
});
