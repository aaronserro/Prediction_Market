package com.betting.backend.wallet.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private static final String FROM_ADDRESS = "pryzmcompany@gmail.com";  // Verified sender

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendFundRequestEmail(String userIdentifier, Long amountCents, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(FROM_ADDRESS);
            helper.setTo("pryzmcompany@gmail.com");
            helper.setSubject("📥 New Fund Request Submitted");

            String amountDollars = String.format("%.2f", amountCents / 100.0);

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; padding: 20px;">

                    <div style="background: linear-gradient(135deg,#6A5AE0,#8F7AE5);
                                padding: 15px;
                                border-radius: 10px;
                                color: white;
                                text-align: center;
                                font-size: 20px;">
                        <strong>New Fund Request</strong>
                    </div>

                    <div style="margin-top: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <p style="font-size: 16px; margin: 0;">
                            <strong>User:</strong> %s
                        </p>
                        <p style="font-size: 16px; margin: 0;">
                            <strong>Requested Amount:</strong> $%s
                        </p>
                        <p style="font-size: 16px; margin: 0;">
                            <strong>Reason:</strong> %s
                        </p>
                    </div>

                    <p style="color: #555; font-size: 14px; margin-top: 20px;">
                        This is an automated notification from the Pryzm Wallet System.
                    </p>

                </div>
            """.formatted(userIdentifier, amountDollars, reason);

            helper.setText(htmlContent, true); // Enable HTML

            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
