export class PasswordValidator {
  static validate(password) {
    const errors = [];

    // 1. التحقق من الطول (Minimum length of 8 characters)
    if (password.length < 8) {
      errors.push("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.");
    }

    // 2. التحقق من التعقيد (Requires at least one uppercase, one lowercase, one number, one special character)
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase) {
      errors.push("يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل.");
    }
    if (!hasLowercase) {
      errors.push("يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل.");
    }
    if (!hasNumber) {
      errors.push("يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.");
    }
    if (!hasSpecialChar) {
      errors.push("يجب أن تحتوي كلمة المرور على حرف خاص واحد على الأقل (!@#$%^&*(),.?\":{}|<>).");
    }

    // 3. التحقق من عدم الشيوع (Simple check for common passwords - can be expanded)
    const commonPasswords = [
      "password", "123456", "qwerty", "admin", "12345678", "123456789",
      "qazwsxedc", "zaqwsxcde", "asdfghjkl", "zxcvbnm", "football", "bank"
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push("كلمة المرور شائعة جداً. يرجى اختيار كلمة مرور أقوى.");
    }

    if (errors.length > 0) {
      return { isValid: false, errors: errors };
    } else {
      return { isValid: true, errors: [] };
    }
  }
}

