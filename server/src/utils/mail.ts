
import Mailgen from "mailgen";
import nodemailer  from "nodemailer";
import { ApiError } from "./apiError";


export const sendMail = async ( options: any ) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "codeyudh",
            link: "https://codeyudh.com",
        },
    });

    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHtml = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: Number(process.env.MAILTRAP_SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.MAILTRAP_SMTP_USER,
          pass: process.env.MAILTRAP_SMTP_PASS,
        },
    })

    const mail = {
        from: process.env.MAILTRAP_FROM,
        to: options.email,
        subject: options.subject,
        text: emailText,
        html: emailHtml,
      }
    
      try {
        await transporter.sendMail(mail);
      } catch (error: any) {
        console.error('Error sending email:', error);
        throw new ApiError( 500, 'Email could not be sent');
      }
}


export const emailVerificationGenContent = ( username: string, verificationUrl: string ) => {
    return {
        body: {
            name: username,
            intro: "Welcome to Codeyudh! We're very excited to have you on board.",
            action: {
                instructions: "To get started with Codeyudh, please verify your email by clicking the button below: ",
                button: {
                    color: "#22BC66",
                    text: "Confirm your account",
                    link: verificationUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        }
    }
}

export const forgotPasswordGenContent = (username: string, passwordResetUrl: string) => {
    return {
      body: {
        name: username,
        intro: 'You have requested to reset your password.',
        action: {
          instructions: 'To reset your password, please click the button below:',
          button: {
            color: '#22BC66',
            text: 'Reset your password',
            link: passwordResetUrl,
          },
        },
        outro: 'If you did not request a password reset, please ignore this email.',
      },
    }
  }