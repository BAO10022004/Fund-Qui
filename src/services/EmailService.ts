// src/services/EmailService.ts
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getPaymentConfig, type PaymentConfig } from './PaymentService';
import type { TransactionStatus } from '../models/Transaction';

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

export interface MemberTransactionEmailPayload {
  memberEmail: string;
  memberName: string;
  memberCode?: string;
  amount: number;
  type: 'thu' | 'chi';
  status: TransactionStatus;
  date: string;
  description: string;
  actionName?: string;
  adminName?: string;
}

export interface EmailSendResult {
  success: boolean;
  method: 'smtp' | 'firestore_log' | 'error';
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
      method: 'smtp',
      message: `Đã gửi email thông báo thành công qua Gmail SMTP tới ${targetEmail}`
    };
  }

  // 2. Lưu bản ghi vào Firestore mail_logs & mail nếu gửi SMTP chưa được
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

/**
 * Tự động gửi email thông báo giao dịch cho Thành viên
 * 1. Thử gửi qua Gmail SMTP trực tiếp (smtp.gmail.com)
 * 2. Lưu bản ghi theo dõi vào Firestore (mail_logs và mail)
 * 3. Fallback qua EmailJS nếu có cấu hình
 */
export const sendTransactionEmailToMember = async (
  payload: MemberTransactionEmailPayload,
  passedConfig?: PaymentConfig
): Promise<EmailSendResult> => {
  const config = passedConfig || (await getPaymentConfig());
  const amountFormatted = new Intl.NumberFormat('vi-VN').format(payload.amount) + ' đ';
  const targetEmail = payload.memberEmail?.trim();

  if (!targetEmail) {
    return {
      success: false,
      method: 'error',
      message: 'Không tìm thấy địa chỉ email của thành viên'
    };
  }

  const isThu = payload.type === 'thu';
  const typeText = isThu ? 'Khoản thu' : 'Khoản chi';
  const isCompleted = payload.status === 'completed';
  const statusText = isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành';
  const statusColor = isCompleted ? '#10b981' : '#f59e0b';
  const statusBg = isCompleted ? '#ecfdf5' : '#fffbeb';

  const emailSubject = `[Quỹ phòng Nasani] Thông báo giao dịch: ${payload.description || typeText} (${amountFormatted}) - ${statusText}`;
  const emailBody = `
Xin chào ${payload.memberName},

Hệ thống Quản lý Quỹ phòng Nasani vừa ghi nhận một giao dịch liên quan đến bạn:
--------------------------------------------------
- Thành viên: ${payload.memberName} ${payload.memberCode ? `(${payload.memberCode})` : ''}
- Loại giao dịch: ${typeText}
${payload.actionName ? `- Hoạt động: ${payload.actionName}\n` : ''}- Số tiền: ${amountFormatted}
- Trạng thái: ${statusText}
- Ngày giao dịch: ${payload.date}
- Nội dung / Ghi chú: ${payload.description || 'Không có ghi chú'}
- Người thực hiện: ${payload.adminName || 'Ban Quản trị Quỹ'}
--------------------------------------------------
Đăng nhập kiểm tra số dư và chi tiết quỹ: https://bao10022004.github.io/Fund-Qui/

Trân trọng,
Hệ thống Quản lý Quỹ phòng Nasani
  `.trim();

  const emailHtml = `
<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
  <div style="background: linear-gradient(135deg, ${isThu ? '#2563eb 0%, #1d4ed8 100%' : '#7c3aed 0%, #6d28d9 100%'}); color: #ffffff; padding: 20px 24px;">
    <h2 style="margin: 0; font-size: 18px; font-weight: 700;">💰 Thông Báo Giao Dịch Mới</h2>
    <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Hệ thống Quản lý Quỹ phòng Nasani</p>
  </div>
  <div style="padding: 24px;">
    <p style="font-size: 14px; color: #334155; margin-top: 0;">Xin chào <strong>${payload.memberName}</strong>,</p>
    <p style="font-size: 14px; color: #334155;">Một giao dịch mới liên quan đến bạn vừa được ghi nhận trên hệ thống Quản lý Quỹ:</p>
    
    <div style="margin: 16px 0; padding: 14px 18px; border-radius: 8px; background: ${statusBg}; border: 1px solid ${statusColor}33; display: flex; align-items: center; justify-content: space-between;">
      <span style="font-size: 13px; color: #64748b; font-weight: 600;">Trạng thái giao dịch:</span>
      <span style="font-size: 13.5px; font-weight: 700; color: ${statusColor};">${isCompleted ? '✓ ' : '⏳ '}${statusText}</span>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 18px 0;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Thành viên:</td>
        <td style="padding: 10px 0; font-weight: bold; color: #0f172a; text-align: right;">${payload.memberName} ${payload.memberCode ? `(${payload.memberCode})` : ''}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Loại giao dịch:</td>
        <td style="padding: 10px 0; font-weight: 600; color: ${isThu ? '#2563eb' : '#dc2626'}; text-align: right;">${typeText}</td>
      </tr>
      ${payload.actionName ? `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Hoạt động / Lý do:</td>
        <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #0f172a;">${payload.actionName}</td>
      </tr>` : ''}
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Số tiền:</td>
        <td style="padding: 10px 0; font-weight: 800; color: ${isThu ? '#059669' : '#dc2626'}; font-size: 17px; text-align: right;">${amountFormatted}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Ngày ghi nhận:</td>
        <td style="padding: 10px 0; font-weight: 600; text-align: right;">${payload.date}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b;">Nội dung chi tiết:</td>
        <td style="padding: 10px 0; color: #334155; font-weight: 500; text-align: right;">${payload.description || 'Không có mô tả'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #64748b;">Người thực hiện:</td>
        <td style="padding: 10px 0; color: #64748b; text-align: right;">${payload.adminName || 'Ban Quản trị Quỹ'}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 26px 0 20px 0;">
      <a href="https://bao10022004.github.io/Fund-Qui/" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
        Xem Chi Tiết Quỹ Phòng
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">Thư thông báo tự động từ Hệ thống Quản lý Quỹ phòng Nasani</p>
  </div>
</div>
  `.trim();

  // 1. Gửi qua SMTP Gmail trực tiếp
  const smtpSent = await sendViaSmtpApi(targetEmail, emailSubject, emailBody, emailHtml);
  if (smtpSent) {
    try {
      await addDoc(collection(db, 'mail_logs'), {
        to: targetEmail,
        subject: emailSubject,
        body: emailBody,
        recipientName: payload.memberName,
        amount: payload.amount,
        type: payload.type,
        statusTx: payload.status,
        createdAt: Timestamp.now(),
        status: 'delivered_smtp'
      });
    } catch { }

    return {
      success: true,
      method: 'smtp',
      message: `Đã gửi email thông báo tới ${targetEmail}`
    };
  }

  // 2. Lưu bản ghi vào Firestore mail_logs & mail
  try {
    await addDoc(collection(db, 'mail_logs'), {
      to: targetEmail,
      subject: emailSubject,
      body: emailBody,
      recipientName: payload.memberName,
      amount: payload.amount,
      type: payload.type,
      statusTx: payload.status,
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

  return {
    success: false,
    method: 'firestore_log',
    message: `Đã lưu thông báo gửi tới ${targetEmail} vào hệ thống.`
  };
};
