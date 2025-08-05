import { SystemManager } from './SystemManager.js';
import { BankingApp } from './app.js';

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('بدء تحميل نظام إدارة الحسابات المصرفية...');
    
    // إنشاء مثيل من النظام
    window.bankingSystem = new SystemManager();
    
    // إنشاء مثيل من التطبيق
    window.bankingApp = new BankingApp();
    
    console.log('تم تحميل النظام بنجاح!');
});

// تصدير النظام للاستخدام العام
export { SystemManager, BankingApp }; 