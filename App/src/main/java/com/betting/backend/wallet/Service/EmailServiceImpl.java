package com.betting.backend.wallet.Service;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
@Service
public class EmailServiceImpl implements EmailService{

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendFundRequestEmail(String userIdentifier, Long amountCents, String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("admin@yourapp.com");
        message.setSubject("New Fund Request Submitted");
        message.setText(
                "User: " + userIdentifier + "\n" +
                "Amount: " + amountCents + " cents\n" +
                "Reason: " + reason
        );

        mailSender.send(message);
    }


}
