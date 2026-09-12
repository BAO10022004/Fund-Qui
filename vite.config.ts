import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodemailer from "nodemailer";

function smtpEmailPlugin() {
  return {
    name: "smtp-email-plugin",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (
          (req.url === "/api/send-email" ||
            req.url === "/Fund-Qui/api/send-email" ||
            req.url?.endsWith("/api/send-email")) &&
          req.method === "POST"
        ) {
          let body = "";
          req.on("data", (chunk: any) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body || "{}");
              const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                  user: "giabaoonutc2@gmail.com",
                  pass: "zaxhlxwulmedygre"
                }
              });

              const recipient = data.to || "giabaoonutc2@gmail.com";
              const info = await transporter.sendMail({
                from: '"Quỹ Phòng Nasani" <giabaoonutc2@gmail.com>',
                to: recipient,
                subject: data.subject || "[NASANI FUND] Thông báo đóng quỹ",
                text: data.text || "",
                html: data.html || `<pre>${data.text || ""}</pre>`
              });

              console.log(`[SMTP Gmail] Đã gửi email thành công tới ${recipient}:`, info.messageId);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true, messageId: info.messageId, recipient }));
            } catch (err: any) {
              console.error("[SMTP Gmail] Lỗi gửi email:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  base: '/Fund-Qui/',
  plugins: [react(), smtpEmailPlugin()]
});
