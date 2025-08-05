import { SystemManager } from './SystemManager.js';

export class BankingApp {
    constructor() {
        this.systemManager = new SystemManager();
        this.currentUser = null;
        this.currentSession = null;
        this.isAdmin = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showScreen('loginScreen');
    }

    setupEventListeners() {
        // تسجيل الدخول والتسجيل
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('registerScreen');
        });
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('loginScreen');
        });

        // تسجيل الخروج
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // التنقل
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // العمليات السريعة
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });

        // إنشاء حساب جديد
        document.getElementById('createAccountBtn').addEventListener('click', () => this.showCreateAccountModal());

        // التحويل
        document.getElementById('transferForm').addEventListener('submit', (e) => this.handleTransfer(e));

        // فلترة المعاملات
        document.getElementById('filterTransactions').addEventListener('click', () => this.filterTransactions());

        // إجراءات المدير
        document.getElementById('freezeAccountBtn').addEventListener('click', () => this.handleAdminAction('freeze'));
        document.getElementById('unfreezeAccountBtn').addEventListener('click', () => this.handleAdminAction('unfreeze'));
        document.getElementById('deleteAccountBtn').addEventListener('click', () => this.handleAdminAction('delete'));

        // إغلاق النافذة المنبثقة
        document.querySelector('.close').addEventListener('click', () => this.hideModal());
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal')) {
                this.hideModal();
            }
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showSection(sectionId) {
        // تحديث التنقل
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // إظهار القسم
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // تحديث المحتوى حسب القسم
        switch(sectionId) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'accounts':
                this.updateAccountsList();
                break;
            case 'transactions':
                this.updateTransactionsList();
                break;
            case 'transfer':
                this.updateTransferForm();
                break;
            case 'admin':
                this.updateAdminPanel();
                break;
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            this.currentSession = this.systemManager.login(username, password);
            this.currentUser = this.systemManager.getUserInfo(this.currentSession);
            this.isAdmin = this.currentUser.role === 'admin';

            // تحديث واجهة المستخدم
            document.getElementById('userInfo').textContent = `مرحباً، ${this.currentUser.username}`;
            
            if (this.isAdmin) {
                document.body.classList.add('admin');
            }

            this.showScreen('mainScreen');
            this.showSection('dashboard');
            this.showNotification('تم تسجيل الدخول بنجاح', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');
        const role = formData.get('role');

        try {
            this.systemManager.createUser(username, password, role);
            this.showNotification('تم إنشاء الحساب بنجاح', 'success');
            this.showScreen('loginScreen');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    handleLogout() {
        if (this.currentSession) {
            this.systemManager.logout(this.currentSession);
        }
        this.currentUser = null;
        this.currentSession = null;
        this.isAdmin = false;
        document.body.classList.remove('admin');
        this.showScreen('loginScreen');
        this.showNotification('تم تسجيل الخروج بنجاح', 'success');
    }

    handleQuickAction(action) {
        switch(action) {
            case 'createAccount':
                this.showCreateAccountModal();
                break;
            case 'deposit':
                this.showDepositModal();
                break;
            case 'withdraw':
                this.showWithdrawModal();
                break;
            case 'transfer':
                this.showSection('transfer');
                break;
        }
    }

    updateDashboard() {
        try {
            const overview = this.systemManager.generateAllAccountsOverview();
            const userAccounts = this.getUserAccounts();
            
            // تحديث الإحصائيات
            document.getElementById('totalAccounts').textContent = userAccounts.length;
            document.getElementById('totalBalance').textContent = `$${userAccounts.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)}`;
            
            const allTransactions = this.systemManager.getTransactionManager().getAllTransactions();
            const userTransactions = allTransactions.filter(t => 
                userAccounts.some(acc => acc.accountNumber === t.accountNumber || acc.accountNumber === t.targetAccount)
            );
            document.getElementById('totalTransactions').textContent = userTransactions.length;

            // تحديث المعاملات الأخيرة
            this.updateRecentTransactions(userTransactions.slice(0, 5));
        } catch (error) {
            console.error('خطأ في تحديث لوحة المعلومات:', error);
        }
    }

    updateRecentTransactions(transactions) {
        const container = document.getElementById('recentTransactionsList');
        container.innerHTML = '';

        if (transactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280;">لا توجد معاملات</p>';
            return;
        }

        transactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            
            const isPositive = transaction.type === 'deposit' || 
                              (transaction.type === 'transfer' && this.getUserAccounts().some(acc => acc.accountNumber === transaction.targetAccount));
            
            item.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-icon ${transaction.type}">
                        <i class="fas ${this.getTransactionIcon(transaction.type)}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${this.getTransactionTitle(transaction.type)}</h4>
                        <p>${transaction.timestamp.toLocaleDateString('ar-SA')}</p>
                    </div>
                </div>
                <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : '-'}$${transaction.amount.toFixed(2)}
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    updateAccountsList() {
        const container = document.getElementById('accountsList');
        const userAccounts = this.getUserAccounts();
        
        container.innerHTML = '';

        userAccounts.forEach(account => {
            const card = document.createElement('div');
            card.className = `account-card ${account.isFrozen ? 'frozen' : ''}`;
            
            card.innerHTML = `
                <div class="account-header">
                    <div class="account-type ${account.accountType}">${account.accountType === 'savings' ? 'توفير' : 'جاري'}</div>
                    ${account.isFrozen ? '<i class="fas fa-lock" style="color: #ef4444;"></i>' : ''}
                </div>
                <div class="account-number">رقم الحساب: ${account.accountNumber}</div>
                <div class="account-holder">${account.accountHolderName}</div>
                <div class="account-balance">$${account.balance.toFixed(2)}</div>
                <div class="account-actions">
                    <button class="btn btn-success" onclick="app.showDepositModal(${account.accountNumber})" ${account.isFrozen ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i> إيداع
                    </button>
                    <button class="btn btn-warning" onclick="app.showWithdrawModal(${account.accountNumber})" ${account.isFrozen ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i> سحب
                    </button>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    updateTransactionsList() {
        const userAccounts = this.getUserAccounts();
        const allTransactions = this.systemManager.getTransactionManager().getAllTransactions();
        const userTransactions = allTransactions.filter(t => 
            userAccounts.some(acc => acc.accountNumber === t.accountNumber || acc.accountNumber === t.targetAccount)
        );

        this.displayTransactions(userTransactions);
    }

    displayTransactions(transactions) {
        const container = document.getElementById('transactionsTable');
        
        if (transactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #6b7280;">لا توجد معاملات</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>الحساب</th>
                    <th>الوصف</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(t => `
                    <tr>
                        <td>${t.timestamp.toLocaleDateString('ar-SA')}</td>
                        <td>${this.getTransactionTitle(t.type)}</td>
                        <td>$${t.amount.toFixed(2)}</td>
                        <td>${t.accountNumber}</td>
                        <td>${t.description}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.innerHTML = '';
        container.appendChild(table);
    }

    updateTransferForm() {
        const select = document.getElementById('fromAccount');
        const userAccounts = this.getUserAccounts();
        
        select.innerHTML = '<option value="">اختر الحساب</option>';
        
        userAccounts.forEach(account => {
            if (!account.isFrozen) {
                const option = document.createElement('option');
                option.value = account.accountNumber;
                option.textContent = `${account.accountHolderName} - $${account.balance.toFixed(2)}`;
                select.appendChild(option);
            }
        });
    }

    updateAdminPanel() {
        if (!this.isAdmin) return;

        try {
            const overview = this.systemManager.generateAllAccountsOverview();
            const userStats = this.systemManager.getAuthManager().getUserStats();
            const suspiciousActivities = this.systemManager.getSuspiciousActivities();

            document.getElementById('adminTotalUsers').textContent = userStats.totalUsers;
            document.getElementById('adminSuspiciousActivities').textContent = suspiciousActivities.length;

            this.updateSuspiciousActivitiesList(suspiciousActivities);
        } catch (error) {
            console.error('خطأ في تحديث لوحة المدير:', error);
        }
    }

    updateSuspiciousActivitiesList(activities) {
        const container = document.getElementById('suspiciousActivitiesList');
        container.innerHTML = '';

        if (activities.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280;">لا توجد أنشطة مشبوهة</p>';
            return;
        }

        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = `activity-item ${activity.type.toLowerCase().replace(' ', '-')}`;
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${activity.type}</strong>
                        <p>${activity.message}</p>
                    </div>
                    <div style="color: #6b7280; font-size: 0.9rem;">
                        ${activity.timestamp.toLocaleDateString('ar-SA')}
                    </div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    handleTransfer(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const fromAccount = formData.get('fromAccount');
        const toAccount = formData.get('toAccount');
        const amount = parseFloat(formData.get('amount'));

        try {
            this.systemManager.transfer(this.currentSession, fromAccount, toAccount, amount);
            this.showNotification('تم التحويل بنجاح', 'success');
            e.target.reset();
            this.updateDashboard();
            this.updateAccountsList();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    filterTransactions() {
        const type = document.getElementById('transactionTypeFilter').value;
        const dateFrom = document.getElementById('transactionDateFrom').value;
        const dateTo = document.getElementById('transactionDateTo').value;

        const criteria = {};
        if (type) criteria.type = type;
        if (dateFrom) criteria.startDate = new Date(dateFrom);
        if (dateTo) criteria.endDate = new Date(dateTo);

        try {
            const report = this.systemManager.generateTransactionReport(criteria);
            this.displayTransactions(report.transactions.map(t => ({
                ...t,
                timestamp: new Date(t.timestamp)
            })));
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    handleAdminAction(action) {
        if (!this.isAdmin) return;

        const accountNumber = document.getElementById('adminAccountNumber').value;
        if (!accountNumber) {
            this.showNotification('يرجى إدخال رقم الحساب', 'warning');
            return;
        }

        try {
            let message = '';
            switch(action) {
                case 'freeze':
                    message = this.systemManager.freezeAccount(this.currentSession, accountNumber);
                    break;
                case 'unfreeze':
                    message = this.systemManager.unfreezeAccount(this.currentSession, accountNumber);
                    break;
                case 'delete':
                    if (confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
                        message = this.systemManager.deleteAccount(this.currentSession, accountNumber);
                    }
                    break;
            }
            
            if (message) {
                this.showNotification(message, 'success');
                document.getElementById('adminAccountNumber').value = '';
                this.updateAccountsList();
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    showCreateAccountModal() {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h3>إنشاء حساب جديد</h3>
            <form id="createAccountForm">
                <div class="form-group">
                    <label for="accountHolderName">اسم صاحب الحساب</label>
                    <input type="text" id="accountHolderName" name="accountHolderName" required>
                </div>
                <div class="form-group">
                    <label for="initialDeposit">الإيداع الأولي</label>
                    <input type="number" id="initialDeposit" name="initialDeposit" min="1" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="accountType">نوع الحساب</label>
                    <select id="accountType" name="accountType">
                        <option value="checking">جاري</option>
                        <option value="savings">توفير</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">إنشاء الحساب</button>
            </form>
        `;

        document.getElementById('createAccountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const account = this.systemManager.createAccount(
                    this.currentSession,
                    formData.get('accountHolderName'),
                    parseFloat(formData.get('initialDeposit')),
                    formData.get('accountType')
                );
                
                this.showNotification('تم إنشاء الحساب بنجاح', 'success');
                this.hideModal();
                this.updateDashboard();
                this.updateAccountsList();
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        });

        this.showModal();
    }

    showDepositModal(accountNumber = null) {
        const userAccounts = this.getUserAccounts();
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <h3>إيداع مبلغ</h3>
            <form id="depositForm">
                <div class="form-group">
                    <label for="depositAccount">الحساب</label>
                    <select id="depositAccount" name="depositAccount" required>
                        <option value="">اختر الحساب</option>
                        ${userAccounts.filter(acc => !acc.isFrozen).map(acc => 
                            `<option value="${acc.accountNumber}" ${accountNumber == acc.accountNumber ? 'selected' : ''}>
                                ${acc.accountHolderName} - ${acc.accountNumber}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="depositAmount">المبلغ</label>
                    <input type="number" id="depositAmount" name="depositAmount" min="0.01" step="0.01" required>
                </div>
                <button type="submit" class="btn btn-primary">إيداع</button>
            </form>
        `;

        document.getElementById('depositForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                this.systemManager.deposit(
                    this.currentSession,
                    formData.get('depositAccount'),
                    parseFloat(formData.get('depositAmount'))
                );
                
                this.showNotification('تم الإيداع بنجاح', 'success');
                this.hideModal();
                this.updateDashboard();
                this.updateAccountsList();
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        });

        this.showModal();
    }

    showWithdrawModal(accountNumber = null) {
        const userAccounts = this.getUserAccounts();
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <h3>سحب مبلغ</h3>
            <form id="withdrawForm">
                <div class="form-group">
                    <label for="withdrawAccount">الحساب</label>
                    <select id="withdrawAccount" name="withdrawAccount" required>
                        <option value="">اختر الحساب</option>
                        ${userAccounts.filter(acc => !acc.isFrozen).map(acc => 
                            `<option value="${acc.accountNumber}" ${accountNumber == acc.accountNumber ? 'selected' : ''}>
                                ${acc.accountHolderName} - ${acc.accountNumber} ($${acc.balance.toFixed(2)})
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="withdrawAmount">المبلغ</label>
                    <input type="number" id="withdrawAmount" name="withdrawAmount" min="0.01" step="0.01" required>
                </div>
                <button type="submit" class="btn btn-primary">سحب</button>
            </form>
        `;

        document.getElementById('withdrawForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                this.systemManager.withdraw(
                    this.currentSession,
                    formData.get('withdrawAccount'),
                    parseFloat(formData.get('withdrawAmount'))
                );
                
                this.showNotification('تم السحب بنجاح', 'success');
                this.hideModal();
                this.updateDashboard();
                this.updateAccountsList();
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        });

        this.showModal();
    }

    showModal() {
        document.getElementById('modal').classList.add('active');
    }

    hideModal() {
        document.getElementById('modal').classList.remove('active');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getUserAccounts() {
        if (!this.currentUser) return [];
        
        return this.currentUser.accountNumbers.map(accountNumber => {
            try {
                return this.systemManager.getAccount(accountNumber).getAccountInfo();
            } catch (error) {
                return null;
            }
        }).filter(account => account !== null);
    }

    getTransactionIcon(type) {
        const icons = {
            'deposit': 'fa-arrow-down',
            'withdrawal': 'fa-arrow-up',
            'transfer': 'fa-exchange-alt',
            'interest': 'fa-percentage'
        };
        return icons[type] || 'fa-circle';
    }

    getTransactionTitle(type) {
        const titles = {
            'deposit': 'إيداع',
            'withdrawal': 'سحب',
            'transfer': 'تحويل',
            'interest': 'فائدة'
        };
        return titles[type] || type;
    }
}

