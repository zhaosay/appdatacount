// 移动端专用脚本
let mobileCurrentAccountId = null;
let mobileCurrentWorks = [];

// 移动端也使用相同的智能标题提取函数
// 这个函数在 work-actions.js 中定义，这里确保移动端也能使用

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadAccountCategories();
    loadMobileAccounts();
    setupMobileEventListeners();
});

// 设置移动端事件监听器
function setupMobileEventListeners() {
    // 搜索功能
    document.getElementById('mobileSearchInput').addEventListener('input', function() {
        filterMobileWorks();
    });
    
    // 导航栏折叠处理
    document.addEventListener('click', function(e) {
        const navbarCollapse = document.getElementById('navbarNav');
        const navbarToggler = document.querySelector('.navbar-toggler');
        
        if (navbarCollapse.classList.contains('show') && 
            !navbarCollapse.contains(e.target) && 
            !navbarToggler.contains(e.target)) {
            bootstrap.Collapse.getInstance(navbarCollapse).hide();
        }
    });
}

// 加载移动端账号列表
async function loadMobileAccounts() {
    try {
        const response = await fetch('core/api.php?action=get_accounts');
        const result = await response.json();
        
        if (result.success) {
            allAccounts = result.data; // 保存所有账号数据，供编辑功能使用
            renderMobileAccountsList(result.data);
        }
    } catch (error) {
        console.error('加载账号失败:', error);
        showMobileAlert('加载账号失败', 'danger');
    }
}

// 渲染移动端账号列表
function renderMobileAccountsList(accounts) {
    const accountsList = document.getElementById('mobileAccountsList');
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
            <div class="mobile-nav-item">
                <span class="mobile-category-indicator" style="background-color: ${groupedAccounts[categoryName][0].category_color || '#6c757d'}"></span>
                <strong>${categoryName}</strong>
            </div>
        `;
        accountsList.appendChild(categoryHeader);
        
        // 账号列表
        groupedAccounts[categoryName].forEach(account => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <div class="mobile-account-item">
                    <a class="mobile-nav-link" href="#" onclick="selectMobileAccount(${account.id})" data-account-id="${account.id}">
                        <div>
                            <div>${account.name}</div>
                            <small class="text-muted">${account.works_count} 个作品</small>
                        </div>
                    </a>
                    <div class="mobile-account-actions">
                        <button class="btn btn-sm btn-outline-light" onclick="editAccount(${account.id})" title="编辑账号">
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

// 选择移动端账号
async function selectMobileAccount(accountId) {
    mobileCurrentAccountId = accountId;
    
    // 关闭导航菜单
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse.classList.contains('show')) {
        bootstrap.Collapse.getInstance(navbarCollapse).hide();
    }
    
    // 更新导航状态
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-account-id="${accountId}"]`).classList.add('active');
    
    // 加载作品
    await loadMobileWorks();
}

// 加载移动端作品列表
async function loadMobileWorks() {
    if (!mobileCurrentAccountId) return;
    
    const container = document.getElementById('mobileWorksContainer');
    container.innerHTML = '<div class="mobile-loading"><div class="spinner-border spinner-border-sm me-2"></div>加载中...</div>';
    
    try {
        const params = new URLSearchParams({
            action: 'get_works_with_daily_metrics',
            account_id: mobileCurrentAccountId
        });
        
        // 添加搜索参数
        const search = document.getElementById('mobileSearchInput').value;
        if (search) params.append('search', search);
        
        const response = await fetch(`core/api.php?${params}`);
        const result = await response.json();
        
        if (result.success) {
            mobileCurrentWorks = result.data;
            renderMobileWorksList(result.data);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('加载作品失败:', error);
        container.innerHTML = `
            <div class="alert alert-danger m-3">
                加载作品失败: ${error.message}
            </div>
        `;
    }
}

// 渲染移动端作品列表
function renderMobileWorksList(works) {
    const container = document.getElementById('mobileWorksContainer');
    
    // 获取当前账号信息
    const currentAccount = allAccounts.find(acc => acc.id === mobileCurrentAccountId);
    const accountName = currentAccount ? currentAccount.name : '未知账号';
    
    if (works.length === 0) {
        container.innerHTML = `
            <div class="mobile-works-header">
                <h6 class="mobile-works-title">
                    <strong>${accountName}</strong> 的作品列表 
                    <span class="mobile-works-count">(0)</span>
                </h6>
            </div>
            <div class="mobile-empty-state">
                <div class="mobile-empty-icon">📝</div>
                <h6>暂无作品</h6>
                <p>点击下方按钮添加第一个作品</p>
                <button class="btn btn-primary mt-3" onclick="showAddWorkModal()">+ 添加作品</button>
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="mobile-works-header">
            <h6 class="mobile-works-title">
                <strong>${accountName}</strong> 的作品列表 
                <span class="mobile-works-count">(${works.length})</span>
            </h6>
            <button class="btn btn-primary btn-sm" onclick="showAddWorkModal()">+ 添加作品</button>
        </div>
    ` + works.map(work => `
        <div class="mobile-work-card mobile-fade-in">
            <div class="mobile-work-header">
                ${work.cover_image ? `
                    <img src="${work.cover_image}" alt="${work.title}" class="mobile-work-cover">
                ` : `
                    <div class="mobile-work-cover-placeholder">
                        <small>无封面</small>
                    </div>
                `}
                <div class="mobile-work-info">
                    <div class="mobile-work-title">${work.title}</div>
                    <div class="mobile-work-meta">
                        发布于 ${formatDate(work.published_at || work.created_at)}
                    </div>
                </div>
            </div>
            
            <div class="mobile-work-stats">
                <div class="mobile-stat-item">
                    <div class="mobile-stat-number">${formatNumber(work.max_likes || 0)}</div>
                    <div class="mobile-stat-label">点赞</div>
                </div>
                <div class="mobile-stat-item">
                    <div class="mobile-stat-number">${formatNumber(work.max_comments || 0)}</div>
                    <div class="mobile-stat-label">评论</div>
                </div>
                <div class="mobile-stat-item">
                    <div class="mobile-stat-number">${formatNumber(work.max_messages || 0)}</div>
                    <div class="mobile-stat-label">私信</div>
                </div>
                <div class="mobile-stat-item">
                    <div class="mobile-stat-number">${formatNumber(work.max_views || 0)}</div>
                    <div class="mobile-stat-label">阅读</div>
                </div>
            </div>
            
            <div class="mobile-work-actions">
                <button class="btn btn-primary btn-mobile" onclick="showMobileMetricsModal(${work.id})">
                    数据录入
                </button>
                <button class="btn btn-outline-secondary btn-mobile" onclick="editWork(${work.id})">
                    编辑
                </button>
                <button class="btn btn-outline-danger btn-mobile" onclick="deleteWork(${work.id})">
                    删除
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// 筛选移动端作品
function filterMobileWorks() {
    if (mobileCurrentAccountId) {
        loadMobileWorks();
    }
}

// 显示移动端数据录入模态框
async function showMobileMetricsModal(workId) {
    currentWorkId = workId;
    
    const work = mobileCurrentWorks.find(w => w.id === workId);
    if (!work) {
        showMobileAlert('作品不存在', 'warning');
        return;
    }
    
    // 计算默认时间范围
    const workDate = new Date(work.created_at);
    const today = new Date();
    const startDate = workDate.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const content = `
        <div class="mobile-metrics-container">
            <div class="mobile-metrics-header">
                <div class="mobile-metrics-title">${work.title}</div>
                <div class="mobile-date-range">
                    <input type="date" class="form-control mobile-date-input" id="mobileMetricsStartDate" value="${startDate}">
                    <span>至</span>
                    <input type="date" class="form-control mobile-date-input" id="mobileMetricsEndDate" value="${endDate}">
                </div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="loadMobileMetricsGrid()">刷新</button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="resetMobileDateRange()">重置</button>
                </div>
            </div>
            
            <div class="mobile-metrics-grid">
                <div id="mobileMetricsGridContainer">
                    <div class="text-center py-3">
                        <div class="spinner-border spinner-border-sm me-2"></div>
                        加载数据中...
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mobile-chart-container">
            <div class="mobile-chart-title">数据趋势</div>
            <div id="mobileMetricsChart" style="height: 300px;"></div>
        </div>
        
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
            <button type="button" class="btn btn-success" onclick="saveMobileMetrics()">保存数据</button>
        </div>
    `;
    
    ModalManager.show(`数据录入`, content, 'modal-lg');
    
    // 加载数据
    await loadMobileMetricsGrid();
}

// 加载移动端数据网格
async function loadMobileMetricsGrid() {
    const startDate = document.getElementById('mobileMetricsStartDate').value;
    const endDate = document.getElementById('mobileMetricsEndDate').value;
    
    if (!startDate || !endDate) {
        showMobileAlert('请选择开始和结束日期', 'warning');
        return;
    }
    
    const container = document.getElementById('mobileMetricsGridContainer');
    container.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm me-2"></div>加载数据中...</div>';
    
    try {
        const response = await fetch(`core/api.php?action=get_work_metrics_grid_by_range&work_id=${currentWorkId}&start_date=${startDate}&end_date=${endDate}`);
        const result = await response.json();
        
        if (result.success) {
            metricsData = result.data;
            renderMobileMetricsGrid(startDate, endDate);
            updateMobileMetricsChart();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        container.innerHTML = `<div class="alert alert-danger">加载数据失败: ${error.message}</div>`;
    }
}

// 渲染移动端数据网格
function renderMobileMetricsGrid(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    // 生成日期范围
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    // 创建数据映射
    const dataMap = {};
    metricsData.forEach(item => {
        dataMap[item.date] = item;
    });
    
    const tableHtml = `
        <table class="table table-bordered mobile-metrics-table">
            <thead>
                <tr>
                    <th>日期</th>
                    <th>点赞</th>
                    <th>评论</th>
                    <th>私信</th>
                    <th>阅读</th>
                </tr>
            </thead>
            <tbody>
                ${dates.map(date => {
                    const data = dataMap[date] || { likes: 0, comments: 0, messages: 0, views: 0 };
                    const dateObj = new Date(date);
                    const isToday = date === new Date().toISOString().split('T')[0];
                    
                    return `
                        <tr ${isToday ? 'class="table-warning"' : ''}>
                            <td>
                                <div style="font-size: 0.75rem;">${date.substring(5)}</div>
                            </td>
                            <td>
                                <input type="number" class="form-control mobile-metrics-input" 
                                       data-date="${date}" data-field="likes" 
                                       value="${data.likes}" min="0" 
                                       onchange="updateMetricsValue(this)">
                            </td>
                            <td>
                                <input type="number" class="form-control mobile-metrics-input" 
                                       data-date="${date}" data-field="comments" 
                                       value="${data.comments}" min="0" 
                                       onchange="updateMetricsValue(this)">
                            </td>
                            <td>
                                <input type="number" class="form-control mobile-metrics-input" 
                                       data-date="${date}" data-field="messages" 
                                       value="${data.messages}" min="0" 
                                       onchange="updateMetricsValue(this)">
                            </td>
                            <td>
                                <input type="number" class="form-control mobile-metrics-input" 
                                       data-date="${date}" data-field="views" 
                                       value="${data.views}" min="0" 
                                       onchange="updateMetricsValue(this)">
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('mobileMetricsGridContainer').innerHTML = tableHtml;
}

// 更新移动端图表
function updateMobileMetricsChart() {
    const chartContainer = document.getElementById('mobileMetricsChart');
    
    if (!chartContainer) {
        console.error('移动端图表容器不存在');
        return;
    }
    
    // 检查ECharts是否已加载
    if (typeof echarts === 'undefined') {
        console.error('ECharts库未加载');
        chartContainer.innerHTML = '<div class="alert alert-warning text-center">图表库加载失败，请刷新页面重试</div>';
        return;
    }
    
    if (!metricsChart) {
        try {
            metricsChart = echarts.init(chartContainer);
        } catch (error) {
            console.error('初始化移动端图表失败:', error);
            chartContainer.innerHTML = '<div class="alert alert-danger text-center">图表初始化失败</div>';
            return;
        }
    }
    
    // 使用与桌面版相同的图表配置，但调整大小
    const sortedData = [...metricsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 如果没有数据，显示空状态
    if (sortedData.length === 0) {
        const option = {
            title: {
                text: '暂无数据',
                left: 'center',
                top: 'middle',
                textStyle: {
                    fontSize: 16,
                    color: '#999'
                }
            },
            graphic: {
                elements: [{
                    type: 'text',
                    left: 'center',
                    top: '60%',
                    style: {
                        text: '请在上方表格中输入数据',
                        fontSize: 12,
                        fill: '#999'
                    }
                }]
            }
        };
        metricsChart.setOption(option);
        return;
    }
    
    const dates = sortedData.map(item => item.date);
    const likes = sortedData.map(item => parseInt(item.likes) || 0);
    const comments = sortedData.map(item => parseInt(item.comments) || 0);
    const messages = sortedData.map(item => parseInt(item.messages) || 0);
    const views = sortedData.map(item => parseInt(item.views) || 0);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
        },
        legend: {
            data: ['点赞', '评论', '私信', '阅读'],
            top: 10,
            textStyle: { fontSize: 12 }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 50,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates,
            axisLabel: {
                fontSize: 10,
                formatter: function(value) {
                    return value.substring(5);
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                fontSize: 10,
                formatter: function(value) {
                    return formatNumber(value);
                }
            }
        },
        series: [
            {
                name: '点赞',
                type: 'line',
                data: likes,
                smooth: true,
                lineStyle: { color: '#ff6b6b', width: 2 },
                itemStyle: { color: '#ff6b6b' }
            },
            {
                name: '评论',
                type: 'line',
                data: comments,
                smooth: true,
                lineStyle: { color: '#4ecdc4', width: 2 },
                itemStyle: { color: '#4ecdc4' }
            },
            {
                name: '私信',
                type: 'line',
                data: messages,
                smooth: true,
                lineStyle: { color: '#45b7d1', width: 2 },
                itemStyle: { color: '#45b7d1' }
            },
            {
                name: '阅读',
                type: 'line',
                data: views,
                smooth: true,
                lineStyle: { color: '#f9ca24', width: 2 },
                itemStyle: { color: '#f9ca24' }
            }
        ]
    };
    
    try {
        metricsChart.setOption(option, true);
        
        // 确保图表正确渲染
        setTimeout(() => {
            if (metricsChart) {
                metricsChart.resize();
            }
        }, 100);
    } catch (error) {
        console.error('设置移动端图表选项失败:', error);
        chartContainer.innerHTML = '<div class="alert alert-danger text-center">图表渲染失败，请重试</div>';
    }
}

// 保存移动端数据
async function saveMobileMetrics() {
    await saveAllMetrics();
    loadMobileWorks(); // 重新加载作品列表
}

// 重置移动端日期范围
function resetMobileDateRange() {
    const work = mobileCurrentWorks.find(w => w.id === currentWorkId);
    if (work) {
        const workDate = new Date(work.created_at);
        const today = new Date();
        
        document.getElementById('mobileMetricsStartDate').value = workDate.toISOString().split('T')[0];
        document.getElementById('mobileMetricsEndDate').value = today.toISOString().split('T')[0];
        
        loadMobileMetricsGrid();
    }
}

// 显示移动端提示信息
function showMobileAlert(message, type = 'info') {
    showAlert(message, type); // 复用桌面版的提示函数
}

// 移动端的图片预览处理（复用桌面版的逻辑）
function handleMobileImagePreview(e) {
    // 移动端使用相同的图片预览和标题提取逻辑
    handleImagePreview(e);
}