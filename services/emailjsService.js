import emailjs from "@emailjs/react-native";

// ─────────────────────────────────────────────────────────────
// EmailJS Configuration
// ─────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || "re6QctN7UZLA_gLCL";
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || "default_service";
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || "template_verification_code";

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// ─────────────────────────────────────────────────────────────
// Send verification code email
// ─────────────────────────────────────────────────────────────
export const sendVerificationEmail = async (email, code) => {
  try {
    const templateParams = {
      to_email: email,
      verification_code: code,
      to_name: email.split("@")[0],
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      return { success: true, message: "Email enviado com sucesso" };
    } else {
      return { success: false, message: "Erro ao enviar email" };
    }
  } catch (error) {
    console.error("EmailJS Error:", error);
    return { 
      success: false, 
      message: error.text || "Erro ao enviar email de verificação" 
    };
  }
};

// ─────────────────────────────────────────────────────────────
// Send generic email (for other purposes)
// ─────────────────────────────────────────────────────────────
export const sendEmail = async (templateParams, templateId = EMAILJS_TEMPLATE_ID) => {
  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams
    );

    if (response.status === 200) {
      return { success: true, message: "Email enviado com sucesso" };
    } else {
      return { success: false, message: "Erro ao enviar email" };
    }
  } catch (error) {
    console.error("EmailJS Error:", error);
    return { 
      success: false, 
      message: error.text || "Erro ao enviar email" 
    };
  }
};
