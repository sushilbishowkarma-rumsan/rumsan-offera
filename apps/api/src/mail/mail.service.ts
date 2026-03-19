import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendLeaveRequestNotification(params: {
    managerEmail: string;
    managerName: string;
    employeeName: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason?: string | null;
    approvalLink: string;
  }) {
    await this.mailerService.sendMail({
      to: params.managerEmail,
      subject: `New Leave Request from ${params.employeeName}`,
      html: `
        <h2>New Leave Request</h2>
        <p>Hi ${params.managerName},</p>
        <p><strong>${params.employeeName}</strong> has submitted a leave request.</p>
        <table border="1" cellpadding="8" style="border-collapse:collapse;">
          <tr><td><strong>Leave Type</strong></td><td>${params.leaveType}</td></tr>
          <tr><td><strong>From</strong></td><td>${params.startDate.toDateString()}</td></tr>
          <tr><td><strong>To</strong></td><td>${params.endDate.toDateString()}</td></tr>
          <tr><td><strong>Total Days</strong></td><td>${params.totalDays}</td></tr>
          <tr><td><strong>Reason</strong></td><td>${params.reason}</td></tr>
        </table>
        <br/>
        <a href="${params.approvalLink}" style="padding:10px 20px;background:#4F46E5;color:white;text-decoration:none;border-radius:5px;">
          Review Request
        </a>
      `,
    });
  }

  async sendWfhRequestNotification(params: {
    managerEmail: string;
    managerName: string;
    employeeName: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason?: string | null;
    approvalLink: string;
  }) {
    await this.mailerService.sendMail({
      to: params.managerEmail,
      subject: `New WFH Request from ${params.employeeName}`,
      html: `
        <h2>New Work From Home Request</h2>
        <p>Hi ${params.managerName},</p>
        <p><strong>${params.employeeName}</strong> has submitted a WFH request.</p>
        <table border="1" cellpadding="8" style="border-collapse:collapse;">
          <tr><td><strong>From</strong></td><td>${params.startDate.toDateString()}</td></tr>
          <tr><td><strong>To</strong></td><td>${params.endDate.toDateString()}</td></tr>
          <tr><td><strong>Total Days</strong></td><td>${params.totalDays}</td></tr>
          <tr><td><strong>Reason</strong></td><td>${params.reason}</td></tr>
        </table>
        <br/>
        <a href="${params.approvalLink}" style="padding:10px 20px;background:#4F46E5;color:white;text-decoration:none;border-radius:5px;">
          Review Request
        </a>
      `,
    });
  }

  async sendRequestStatusNotification(params: {
    employeeEmail: string;
    employeeName: string;
    requestType: 'Leave' | 'WFH';
    action: 'APPROVED' | 'REJECTED';
    startDate: Date;
    endDate: Date;
    approverComment?: string;
  }) {
    const isApproved = params.action === 'APPROVED';

    await this.mailerService.sendMail({
      to: params.employeeEmail,
      subject: `Your ${params.requestType} Request has been ${isApproved ? 'Approved' : 'Rejected'}`,
      html: `
      <h2>${params.requestType} Request ${isApproved ? 'Approved ✅' : 'Rejected ❌'}</h2>
      <p>Hi ${params.employeeName},</p>
      <p>Your ${params.requestType.toLowerCase()} request has been <strong>${isApproved ? 'approved' : 'rejected'}</strong>.</p>
      <table border="1" cellpadding="8" style="border-collapse:collapse;">
        <tr><td><strong>From</strong></td><td>${params.startDate.toDateString()}</td></tr>
        <tr><td><strong>To</strong></td><td>${params.endDate.toDateString()}</td></tr>
        ${
          params.approverComment
            ? `<tr><td><strong>Comment</strong></td><td>${params.approverComment}</td></tr>`
            : ''
        }
      </table>
      <br/>
      <a href="${process.env.APP_URL}/dashboard/leave/history"
         style="padding:10px 20px;background:${isApproved ? '#16a34a' : '#dc2626'};color:white;text-decoration:none;border-radius:5px;">
        View Request
      </a>
    `,
    });
  }

  async sendExceededLeaveWarning(params: {
    employeeEmail: string;
    employeeName: string;
    exceededLeaves: {
      leaveType: string;
      label: string;
      total: number;
      exceeded: number;
    }[];
    totalExceededDays: number;
    monthName: string;
    year: number;
    daysUntilMonthEnd: number;
  }) {
    const rows = params.exceededLeaves
      .map(
        (l) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${l.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${l.total}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#dc2626;font-weight:bold;">${l.exceeded}</td>
        </tr>
      `,
      )
      .join('');

    await this.mailerService.sendMail({
      to: params.employeeEmail,
      subject: `⚠️ Leave Exceeded — Payroll Deduction Notice (${params.monthName} ${params.year})`,
      html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;">
        <div style="background:#dc2626;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;">⚠️ Leave Exceeded — Payroll Deduction Notice</h2>
        </div>
        <div style="padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
          <p>Hi <strong>${params.employeeName}</strong>,</p>
          <p>
            This is a reminder that you have exceeded your leave quota this month.
            The exceeded days will be <strong>deducted from your ${params.monthName} ${params.year} payroll</strong>.
          </p>
          <p style="color:#dc2626;">
            ⏳ <strong>${params.daysUntilMonthEnd} days</strong> remaining until month end.
          </p>

          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:10px 12px;text-align:left;">Leave Type</th>
                <th style="padding:10px 12px;text-align:center;">Quota (Days)</th>
                <th style="padding:10px 12px;text-align:center;color:#dc2626;">Exceeded (Days)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
            <tfoot>
              <tr style="background:#fef2f2;">
                <td style="padding:10px 12px;font-weight:bold;" colspan="2">Total Exceeded Days</td>
                <td style="padding:10px 12px;text-align:center;color:#dc2626;font-weight:bold;font-size:16px;">
                  ${params.totalExceededDays} day${params.totalExceededDays > 1 ? 's' : ''}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px;margin:16px 0;">
            <strong>Note:</strong> These ${params.totalExceededDays} exceeded day(s) will be reflected 
            as a deduction in your <strong>${params.monthName} ${params.year}</strong> payroll.
            Please contact HR if you have any questions.
          </div>

          <p style="color:#6b7280;font-size:13px;margin-top:24px;">
            This is an automated message from Offera HR. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    });
  }
}
