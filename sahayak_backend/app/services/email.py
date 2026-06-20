import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_notification_email(to_email: str, full_name: str, enabled: bool) -> bool:
    """
    Sends a confirmation email to the citizen when they enable or disable email alerts.
    Falls back gracefully to console logs if SMTP settings are not configured.
    """
    if enabled:
        subject = "Sahayak AI - Email Alerts Activated"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px;">
            <div style="max-width: 600px; margin: 0 auto; padding: 32px; border: 1.5px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
                    <span style="font-size: 24px;">🌾</span>
                    <h2 style="color: #d97706; margin: 0; font-family: sans-serif; font-size: 22px;">Sahayak AI Portal</h2>
                </div>
                <p style="font-size: 15px; margin-top: 0;">Dear <strong>{full_name}</strong>,</p>
                <p style="font-size: 14px; color: #475569;">You have successfully <strong>enabled</strong> email alerts on the Sahayak AI portal.</p>
                <p style="font-size: 14px; color: #475569;">You will now receive automatic updates directly in your inbox whenever a new matched scheme is identified, eligibility criteria change, or deadlines approach.</p>
                <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
                    If you did not request this update, please ignore this email or update your settings in the citizen portal.
                </div>
            </div>
        </body>
        </html>
        """
    else:
        subject = "Sahayak AI - Email Alerts Deactivated"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px;">
            <div style="max-width: 600px; margin: 0 auto; padding: 32px; border: 1.5px solid #fca5a5; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
                    <span style="font-size: 24px;">🌾</span>
                    <h2 style="color: #dc2626; margin: 0; font-family: sans-serif; font-size: 22px;">Sahayak AI Portal</h2>
                </div>
                <p style="font-size: 15px; margin-top: 0;">Dear <strong>{full_name}</strong>,</p>
                <p style="font-size: 14px; color: #475569;">You have successfully <strong>disabled</strong> email alerts on the Sahayak AI portal.</p>
                <p style="font-size: 14px; color: #475569;">You will no longer receive automatic email updates regarding matches or application deadlines.</p>
                <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
                    If you did not request this update, please log back in to your Sahayak citizen portal to re-enable alerts.
                </div>
            </div>
        </body>
        </html>
        """

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", "no-reply@sahayak.in")

    print(f"[EMAIL SERVICE] Notification trigger: {to_email} (enabled={enabled})")

    if smtp_host and smtp_username and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = to_email
            
            part = MIMEText(body, "html")
            msg.attach(part)
            
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_from, to_email, msg.as_string())
            print(f"[EMAIL SERVICE] Real email successfully sent via SMTP to {to_email}!")
            return True
        except Exception as e:
            print(f"[EMAIL SERVICE] SMTP execution failed (will fallback to mock log): {e}")
            
    # Fallback mock logger output
    print(f"\n========================================================")
    print(f"📄 MOCK EMAIL SENT")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body Preview: {body.replace('<br/>', '\n').replace('<strong>', '').replace('</strong>', '').replace('  ', '').strip()[:350]}...")
    print(f"========================================================\n")
    return True
