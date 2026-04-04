import nodemailer from "nodemailer";

const transporter = (process.env.SMTP_HOST && process.env.SMTP_USER) 
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export const sendEmailReminder = async (email, task) => {
  if (!transporter) {
    console.log(`[Notification] Would send email to ${email} for task: "${task.title}". SMTP not configured.`);
    return;
  }

  const mailOptions = {
    from: `"MeetFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `🕒 Reminder: Task "${task.title}" is due soon!`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Upcoming Deadline</h2>
        <p>This is a reminder that the following task is still <strong>pending</strong> and is due in approximately 48 hours:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${task.title}</h3>
          <p>${task.description || "No description provided."}</p>
          <p><strong>Due Date:</strong> ${task.deadline || "Not specified"}</p>
        </div>
        <p>Please update the task status in MeetFlow once completed.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Sent automatically by MeetFlow App.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Notification] Email reminder sent to ${email}`);
  } catch (error) {
    console.error("[Notification] Failed to send email:", error.message);
  }
};
