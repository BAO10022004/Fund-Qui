import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as nodemailer from "nodemailer";

setGlobalOptions({ maxInstances: 10 });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "giabaoonutc2@gmail.com",
    pass: "zaxhlxwulmedygre",
  },
});

/**
 * Tự động gửi email khi có bản ghi mới trong collection 'mail_logs' trên Firestore
 */
export const onPaymentMailLogCreated = onDocumentCreated(
  "mail_logs/{logId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    if (data.status === "delivered_smtp" || data.status === "sent") {
      // Đã gửi trước đó qua dev middleware, không gửi trùng
      return;
    }

    try {
      const recipient = data.to || "giabaoonutc2@gmail.com";
      const info = await transporter.sendMail({
        from: '"Quỹ Phòng Nasani" <giabaoonutc2@gmail.com>',
        to: recipient,
        subject: data.subject || "[NASANI FUND] Yêu cầu duyệt đóng quỹ",
        text: data.body || "",
        html: data.html || `<pre>${data.body || ""}</pre>`,
      });

      logger.info(`[Functions] Gửi email thành công tới ${recipient}:`, info.messageId);
      await snap.ref.update({
        status: "sent",
        messageId: info.messageId,
        sentAt: new Date(),
      });
    } catch (err: any) {
      logger.error("[Functions] Lỗi gửi email qua Gmail SMTP:", err);
      await snap.ref.update({
        status: "error",
        error: err.message || "Unknown error",
      });
    }
  }
);

/**
 * HTTP Function gửi email trực tiếp
 */
export const sendEmailHttp = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { to, subject, text, html } = req.body;
    const recipient = to || "giabaoonutc2@gmail.com";

    const info = await transporter.sendMail({
      from: '"Quỹ Phòng Nasani" <giabaoonutc2@gmail.com>',
      to: recipient,
      subject: subject || "[NASANI FUND] Thông báo hệ thống",
      text: text || "",
      html: html || `<pre>${text || ""}</pre>`,
    });

    res.json({ success: true, messageId: info.messageId, recipient });
  } catch (err: any) {
    logger.error("[Functions] HTTP Send error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
