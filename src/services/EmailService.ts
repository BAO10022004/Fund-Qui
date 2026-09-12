// src/services/EmailService.ts
import emailjs from '@emailjs/browser';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getPaymentConfig, type PaymentConfig } from './PaymentService';

export interface PaymentEmailPayload {
  adminEmail: string;
  senderName: string;
  senderCode?: string;
  amount: number;
  transferContent: string;
  bankName: string;
  accountNumber: string;
  transactionCount: number;
  timeString: string;
}

export interface EmailSendResult {
  success: boolean;
  method: 'emailjs' | 'firestore_log' | 'error';
  message: string;
}

/**
 * Gửi email qua backend/dev middleware SMTP sử dụng Gmail SMTP
 */
async function sendViaSmtpApi(to: string, subject: string, text: string, html: string): Promise<boolean> {
  const endpoints = ['/api/send-email', '/Fund-Qui/api/send-email'];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, text, html })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return true;
      }
    } catch {
      // Tiếp tục thử endpoint kế tiếp
    }
  }
  return false;
}

/**
 * Tự động gửi email thông báo thanh toán cho Admin
 * 1. Thử gửi qua Gmail SMTP trực tiếp (smtp.gmail.com: giabaoonutc2@gmail.com)
 * 2. Nếu không được, gửi qua EmailJS nếu có cấu hình
 * 3. Luôn lưu bản ghi theo dõi vào Firestore (mail_logs và mail)
 */
export const sendPaymentEmailToAdmin = async (
  payload: PaymentEmailPayload,
  passedConfig?: PaymentConfig
): Promise<EmailSendResult> => {
  const config = passedConfig || (await getPaymentConfig());
  const amountFormatted = new Intl.NumberFormat('vi-VN').format(payload.amount) + ' đ';
  const targetEmail = payload.adminEmail || 'giabaoonutc2@gmail.com';

  const emailSubject = `[Quỹ phòng Quí] Yêu cầu duyệt đóng quỹ từ ${payload.senderName} (${amountFormatted})`;
  const emailBody = `
Xin chào Quản trị viên,

Hệ thống Quỹ phòng Nasani vừa ghi nhận yêu cầu xác nhận thanh toán quỹ từ thành viên:
--------------------------------------------------
- Thành viên: ${payload.senderName} ${payload.senderCode ? `(${payload.senderCode})` : ''}
- Số tiền: ${amountFormatted}
- Ngân hàng thụ hưởng: ${payload.bankName}
- Số tài khoản: ${payload.accountNumber}
- Nội dung chuyển khoản: ${payload.transferContent}
- Số lượng khoản nợ: ${payload.transactionCount} khoản
- Thời gian: ${payload.timeString}
--------------------------------------------------
Đăng nhập: https://bao10022004.github.io/Fund-Qui/

Trân trọng,
Hệ thống Quản lý Quỹ Nasani
  `.trim();

  const emailHtml = `
<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 20px 24px;">
    <h2 style="margin: 0; font-size: 18px; font-weight: 700;">🔔 Yêu Cầu Duyệt Đóng Quỹ Mới</h2>
    <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Hệ thống Quản lý Quỹ phòng Nasani</p>
  </div>
  <div style="padding: 24px;">
    <p style="font-size: 14px; color: #334155; margin-top: 0;">Xin chào Quản trị viên,</p>
    <p style="font-size: 14px; color: #334155;">Thành viên <strong>${payload.senderName}</strong> vừa xác nhận đã chuyển khoản đóng quỹ với thông tin chi tiết dưới đây:</p>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 18px 0;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Thành viên:</td>
        <td style="padding: 10px 0; font-weight: bold; color: #0f172a; text-align: right;">${payload.senderName} ${payload.senderCode ? `(${payload.senderCode})` : ''}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Số tiền:</td>
        <td style="padding: 10px 0; font-weight: 800; color: #2563eb; font-size: 16px; text-align: right;">${amountFormatted}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Ngân hàng nhận:</td>
        <td style="padding: 10px 0; font-weight: 600; text-align: right;">${payload.bankName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Số tài khoản:</td>
        <td style="padding: 10px 0; font-family: monospace; font-weight: 700; text-align: right;">${payload.accountNumber}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Nội dung CK:</td>
        <td style="padding: 10px 0; color: #0369a1; font-weight: bold; text-align: right;">${payload.transferContent}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Thời gian gửi:</td>
        <td style="padding: 10px 0; text-align: right;">${payload.timeString}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 26px 0 22px 0;">
      <a href="https://bao10022004.github.io/Fund-Qui/" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
        Đăng nhập
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">Thư thông báo tự động từ Hệ thống Quỹ phòng Nasani</p>
  </div>
</div>
  `.trim();

  // 1. Thử gửi qua SMTP Gmail trực tiếp (dùng credentials do người dùng cung cấp)
  const smtpSent = await sendViaSmtpApi(targetEmail, emailSubject, emailBody, emailHtml);
  if (smtpSent) {
    try {
      await addDoc(collection(db, 'mail_logs'), {
        to: targetEmail,
        subject: emailSubject,
        body: emailBody,
        senderName: payload.senderName,
        amount: payload.amount,
        createdAt: Timestamp.now(),
        status: 'delivered_smtp'
      });
    } catch { }

    return {
      success: true,
      method: 'emailjs',
      message: `Đã gửi email thông báo thành công qua Gmail SMTP tới ${targetEmail}`
    };
  }

  // 2. Lưu bản ghi vào Firestore mail_logs & mail
  try {
    await addDoc(collection(db, 'mail_logs'), {
      to: targetEmail,
      subject: emailSubject,
      body: emailBody,
      senderName: payload.senderName,
      amount: payload.amount,
      createdAt: Timestamp.now(),
      status: 'pending'
    });
  } catch (logErr) {
    console.warn('Lỗi ghi log mail_logs:', logErr);
  }

  try {
    await addDoc(collection(db, 'mail'), {
      to: [targetEmail],
      message: {
        subject: emailSubject,
        text: emailBody,
        html: emailHtml
      },
      createdAt: Timestamp.now()
    });
  } catch (mailErr) {
    console.warn('Lỗi ghi collection mail:', mailErr);
  }

  // 3. Fallback gửi qua EmailJS nếu có cấu hình
  const hasEmailJS =
    Boolean(config.emailjsServiceId?.trim()) &&
    Boolean(config.emailjsTemplateId?.trim()) &&
    Boolean(config.emailjsPublicKey?.trim());

  if (hasEmailJS) {
    try {
      const templateParams = {
        to_email: targetEmail,
        to_name: 'Quản trị viên',
        from_name: 'Hệ thống Quỹ Phòng Nasani',
        sender_name: payload.senderName,
        sender_code: payload.senderCode || 'N/A',
        amount: amountFormatted,
        amount_raw: payload.amount,
        bank_name: payload.bankName,
        account_number: payload.accountNumber,
        transfer_content: payload.transferContent,
        transaction_count: payload.transactionCount,
        time_string: payload.timeString,
        subject: emailSubject,
        message: emailBody
      };

      await emailjs.send(
        config.emailjsServiceId!.trim(),
        config.emailjsTemplateId!.trim(),
        templateParams,
        config.emailjsPublicKey!.trim()
      );

      return {
        success: true,
        method: 'emailjs',
        message: `Đã gửi email thông báo thành công tới ${targetEmail}`
      };
    } catch (emailjsErr: any) {
      console.error('❌ EmailJS error:', emailjsErr);
    }
  }

  return {
    success: false,
    method: 'firestore_log',
    message: 'Đã lưu yêu cầu vào hệ thống và thông báo chuông.'
  };
};

/**
 * Gửi email kiểm tra kết nối từ trang Admin
 */
export const sendTestEmail = async (config: PaymentConfig): Promise<EmailSendResult> => {
  const targetEmail = config.adminEmail || 'giabaoonutc2@gmail.com';
  const nowStr = new Date().toLocaleString('vi-VN');

  const payload: PaymentEmailPayload = {
    adminEmail: targetEmail,
    senderName: 'Kiểm Tra Hệ Thống (Test)',
    senderCode: 'TEST01',
    amount: 50000,
    transferContent: 'TEST01 DONG QUY TEST',
    bankName: config.bankName,
    accountNumber: config.accountNumber,
    transactionCount: 1,
    timeString: nowStr
  };

  return sendPaymentEmailToAdmin(payload, config);
};
