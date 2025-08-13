// 主要功能脚本
let currentAccountId = null;
let currentWorks = [];
let accountCategories = [];
let allAccounts = []; // 存储所有账号信息

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadAccountCategories();
    loadAccounts();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 搜索功能
    document.getElementById('searchInput').addEventListener('input', function() {
        filterWorks();
    });
    
    // 日期筛选
    document.getElementById('startDate').addEventListener('change', filterWorks);
    document.getElementById('endDate').addEventListener('change', filterWorks);
    
    // 设置默认日期为当天
    setDefaultDates();
}

// 设置默认日期为当天
function setDefaultDates() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && endDateInput) {
        startDateInput.value = todayStr;
        endDateInput.value = todayStr;
    }
}

// 加载账号分类
async function loadAccountCategories() {
    try {
        const response = await fetch('core/api.php?action=get_account_categories');
        const result = await response.json();
        
        if (result.success) {
            accountCategories = result.data;
        }
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 加载账号列表
async function loadAccounts() {
    try {
        const response = await fetch('core/api.php?action=get_accounts');
        const result = await response.json();
        
        if (result.success) {
            allAccounts = result.data; // 保存所有账号数据
            renderAccountsList(result.data);
        }
    } catch (error) {
        console.error('加载账号失败:', error);
        showAlert('加载账号失败', 'danger');
    }
}

// 渲染账号列表
function renderAccountsList(accounts) {
    const accountsList = document.getElementById('accountsList');
    accountsList.innerHTML = '';
    
    // 按分类分组
    const groupedAccounts = {};
    accounts.forEach(account => {
        const categoryName = account.category_name || '未分类';
        if (!groupedAccounts[categoryName]) {
            groupedAccounts[categoryName] = [];
        }
        groupedAccounts[categoryName].push(account);
    });
    
    // 渲染分组
    Object.keys(groupedAccounts).forEach(categoryName => {
        // 分类标题
        const categoryHeader = document.createElement('li');
        categoryHeader.className = 'nav-item';
        categoryHeader.innerHTML = `
            <div class="sidebar-heading mt-3 mb-2">
                <span class="category-indicator" style="background-color: ${groupedAccounts[categoryName][0].category_color || '#6c757d'}"></span>
                ${categoryName}
            </div>
        `;
        accountsList.appendChild(categoryHeader);
        
        // 账号列表
        groupedAccounts[categoryName].forEach(account => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <div class="account-item">
                    <a class="nav-link" href="#" onclick="selectAccount(${account.id})" data-account-id="${account.id}">
                        ${account.name}
                        <small class="text-muted d-block">${account.works_count} 个作品</small>
                    </a>
                    <div class="account-actions">
                        <button class="btn btn-sm btn-outline-secondary" onclick="editAccount(${account.id})" title="编辑账号">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount(${account.id})" title="删除账号">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
            accountsList.appendChild(li);
        });
    });
}

// 选择账号
async function selectAccount(accountId) {
    currentAccountId = accountId;
    
    // 更新导航状态
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-account-id="${accountId}"]`).classList.add('active');
    
    // 加载作品
    await loadWorks();
}

// 加载作品列表
async function loadWorks() {
    if (!currentAccountId) return;
    
    const container = document.getElementById('worksContainer');
    container.innerHTML = '<div class="loading"><div class="spinner-border spinner-border-sm me-2"></div>加载中...</div>';
    
    try {
        const params = new URLSearchParams({
            action: 'get_works_with_daily_metrics',
            account_id: currentAccountId
        });
        
        // 添加搜索和筛选参数
        const search = document.getElementById('searchInput').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (search) params.append('search', search);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const response = await fetch(`core/api.php?${params}`);
        const result = await response.json();
        
        if (result.success) {
            currentWorks = result.data;
            renderWorksList(result.data);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('加载作品失败:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                加载作品失败: ${error.message}
            </div>
        `;
    }
}

// 渲染作品列表
function renderWorksList(works) {
    const container = document.getElementById('worksContainer');
    
    if (works.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h5>暂无作品</h5>
                <p>点击下方按钮添加第一个作品</p>
                <button class="btn btn-primary mt-3" onclick="showAddWorkModal()">+ 添加作品</button>
            </div>
        `;
        return;
    }
    
    // 获取当前账号信息
    const currentAccount = allAccounts.find(acc => parseInt(acc.id) === parseInt(currentAccountId));
    const accountName = currentAccount ? currentAccount.name : '未知账号';
    
    const html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="works-header">
                <h5 class="works-title">
                    <strong>${accountName}</strong> 的作品列表 
                    <span class="works-count">(${works.length})</span>
                </h5>
            </div>
            <button class="btn btn-primary" onclick="showAddWorkModal()">+ 添加作品</button>
        </div>
        <div class="row">
            ${works.map(work => `
                <div class="col-6 col-sm-4 col-md-4 col-lg-3 col-xl-2 mb-4">
                    <div class="work-card fade-in">
                        ${work.cover_image ? `
                            <img src="${work.cover_image}" alt="${work.title}" class="work-cover">
                        ` : `
                            <div class="work-cover-placeholder">
                                <span>无封面</span>
                            </div>
                        `}
                        <div class="work-card-content">
                            <h6 class="work-title">${work.title}</h6>
                            <div class="work-publish-time mb-2">
                                <small class="text-muted">${formatDate(work.published_at || work.created_at)}</small>
                            </div>
                            <div class="work-stats mb-3">
                                <small>♥ ${formatNumber(work.max_likes || 0)}</small>
                                <small>💬 ${formatNumber(work.max_comments || 0)}</small>
                                <small>✉ ${formatNumber(work.max_messages || 0)}</small>
                                <small>👁 ${formatNumber(work.max_views || 0)}</small>
                            </div>
                            <div class="work-actions mt-auto">
                                <div class="d-grid gap-1">
                                    <button class="btn btn-primary btn-sm" onclick="showMetricsModal(${work.id})">
                                        数据录入
                                    </button>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-outline-secondary btn-sm flex-fill" onclick="editWork(${work.id})" title="编辑作品">
                                            编辑
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm flex-fill" onclick="deleteWork(${work.id})" title="删除作品">
                                            删除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

// 筛选作品
function filterWorks(timeRange = null) {
    if (timeRange) {
        const today = new Date();
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        switch (timeRange) {
            case 'today':
                const todayStr = today.toISOString().split('T')[0];
                startDate.value = todayStr;
                endDate.value = todayStr;
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                startDate.value = weekStart.toISOString().split('T')[0];
                endDate.value = today.toISOString().split('T')[0];
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate.value = monthStart.toISOString().split('T')[0];
                endDate.value = today.toISOString().split('T')[0];
                break;
        }
    }
    
    if (currentAccountId) {
        loadWorks();
    }
}

// 显示提示信息
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 格式化数字
function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}