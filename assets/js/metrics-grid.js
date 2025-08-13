// 数据录入网格功能

let currentWorkId = null;
let metricsChart = null;
let metricsData = [];

// 显示数据录入模态框
async function showMetricsModal(workId) {
    currentWorkId = workId;
    
    const work = currentWorks.find(w => parseInt(w.id) === parseInt(workId));
    if (!work) {
        showAlert('作品不存在', 'warning');
        return;
    }
    
    // 计算默认时间范围（从作品创建日期到今天）
    const workDate = new Date(work.created_at);
    const today = new Date();
    const startDate = workDate.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const content = `
        <div class="metrics-modal-content">
            <!-- 作品信息 -->
            <div class="work-info mb-3 p-3 bg-light rounded">
                <h6 class="mb-2">${work.title}</h6>
                <small class="text-muted">创建时间: ${formatDate(work.created_at)}</small>
            </div>
            
            <!-- 时间范围控制 -->
            <div class="row mb-3">
                <div class="col-md-4">
                    <label class="form-label">开始日期</label>
                    <input type="date" class="form-control" id="metricsStartDate" value="${startDate}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">结束日期</label>
                    <input type="date" class="form-control" id="metricsEndDate" value="${endDate}">
                </div>
                <div class="col-md-4 d-flex align-items-end">
                    <button class="btn btn-outline-primary me-2" onclick="loadMetricsGrid()">刷新数据</button>
                    <button class="btn btn-outline-secondary" onclick="resetDateRange()">重置范围</button>
                </div>
            </div>
            
            <!-- 数据录入表格 -->
            <div class="metrics-grid mb-4">
                <div id="metricsGridContainer">
                    <div class="text-center py-3">
                        <div class="spinner-border spinner-border-sm me-2"></div>
                        加载数据中...
                    </div>
                </div>
            </div>
            
            <!-- 趋势图表 -->
            <div class="chart-container">
                <div class="chart-title">数据趋势图</div>
                <div id="metricsChart" style="height: 400px;"></div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-success" onclick="saveAllMetrics()">保存所有数据</button>
            </div>
        </div>
    `;
    
    ModalManager.show(`数据录入 - ${work.title}`, content, 'modal-xl');
    
    // 延迟加载数据，确保模态框完全显示后再初始化图表
    setTimeout(async () => {
        await loadMetricsGrid();
        // 再次延迟初始化图表，确保DOM完全渲染
        setTimeout(() => {
            initializeChart();
        }, 200);
    }, 300);
}

// 加载数据录入网格
async function loadMetricsGrid() {
    const startDate = document.getElementById('metricsStartDate').value;
    const endDate = document.getElementById('metricsEndDate').value;
    
    if (!startDate || !endDate) {
        showAlert('请选择开始和结束日期', 'warning');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showAlert('开始日期不能晚于结束日期', 'warning');
        return;
    }
    
    const container = document.getElementById('metricsGridContainer');
    container.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm me-2"></div>加载数据中...</div>';
    
    try {
        const response = await fetch(`core/api.php?action=get_work_metrics_grid_by_range&work_id=${currentWorkId}&start_date=${startDate}&end_date=${endDate}`);
        const result = await response.json();
        
        if (result.success) {
            metricsData = result.data;
            renderMetricsGrid(startDate, endDate);
            updateMetricsChart();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        container.innerHTML = `<div class="alert alert-danger">加载数据失败: ${error.message}</div>`;
    }
}

// 渲染数据录入网格
function renderMetricsGrid(startDate, endDate) {
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
        <table class="table table-bordered metrics-table">
            <thead>
                <tr>
                    <th style="width: 120px;">日期</th>
                    <th style="width: 100px;">点赞数</th>
                    <th style="width: 100px;">评论数</th>
                    <th style="width: 100px;">私信数</th>
                    <th style="width: 100px;">阅读/播放量</th>
                    <th style="width: 80px;">操作</th>
                </tr>
            </thead>
            <tbody>
                ${dates.map(date => {
                    const data = dataMap[date] || { likes: 0, comments: 0, messages: 0, views: 0 };
                    const dateObj = new Date(date);
                    const isToday = date === new Date().toISOString().split('T')[0];
                    const dayName = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()];
                    
                    return `
                        <tr id="metrics-row-${date}" ${isToday ? 'class="table-warning"' : ''}>
                            <td class="date-cell">
                                <span class="date-text">${date}（周${dayName}）</span>
                            </td>
                            <td>
                                <input type="number" class="form-control metrics-input" 
                                       data-date="${date}" data-field="likes" 
                                       value="${data.likes}" min="0" 
                                       onchange="updateMetricsValue(this)">
                            </td>
                            <td>
                                <input type="number" class="form-control metrics-input" 
                                       data-date="${date}" data-field="comments" 
                                       value="${data.comments}" min="0" 
                                       onchange="updateMetricsValue(this)">
                            </td>
                            <td>
                                <input type="number" class="form-control metrics-input" 
                                       data-date="${date}" data-field="messages" 
                                       value="${data.messages}" min="0" 
                                       onchange="updateMetricsValue(this)">
                            </td>
                            <td>
                                <input type="number" class="form-control metrics-input" 
                                       data-date="${date}" data-field="views" 
                                       value="${data.views}" min="0" 
                                       onchange="updateMetricsValue(this)">
                            </td>
                            <td>
                                <button class="btn btn-success btn-sm metrics-save-btn" 
                                        onclick="saveRowMetrics('${date}')" 
                                        id="save-btn-${date}">
                                    保存
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('metricsGridContainer').innerHTML = tableHtml;
}

// 更新数据值
function updateMetricsValue(input) {
    const date = input.dataset.date;
    const field = input.dataset.field;
    const value = parseInt(input.value) || 0;
    
    // 更新内存中的数据
    let dataItem = metricsData.find(item => item.date === date);
    if (!dataItem) {
        dataItem = { date, likes: 0, comments: 0, messages: 0, views: 0 };
        metricsData.push(dataItem);
    }
    dataItem[field] = value;
    
    // 实时更新图表
    updateMetricsChart();
}

// 更新趋势图表
function updateMetricsChart() {
    const chartContainer = document.getElementById('metricsChart');
    
    if (!chartContainer) {
        console.error('图表容器不存在');
        return;
    }
    
    // 检查ECharts是否已加载
    if (typeof echarts === 'undefined') {
        console.error('ECharts库未加载');
        chartContainer.innerHTML = '<div class="alert alert-warning">图表库加载失败，请刷新页面重试</div>';
        return;
    }
    
    if (!metricsChart) {
        try {
            metricsChart = echarts.init(chartContainer);
        } catch (error) {
            console.error('初始化图表失败:', error);
            chartContainer.innerHTML = '<div class="alert alert-danger">图表初始化失败</div>';
            return;
        }
    }
    
    // 准备图表数据
    const sortedData = [...metricsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 如果没有数据，显示空状态
    if (sortedData.length === 0) {
        const option = {
            title: {
                text: '暂无数据',
                left: 'center',
                top: 'middle',
                textStyle: {
                    fontSize: 18,
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
                        fontSize: 14,
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
        title: {
            text: '数据趋势',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: ['点赞数', '评论数', '私信数', '阅读/播放量'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 80,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates,
            axisLabel: {
                formatter: function(value) {
                    return new Date(value).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function(value) {
                    return formatNumber(value);
                }
            }
        },
        series: [
            {
                name: '点赞数',
                type: 'line',
                data: likes,
                smooth: true,
                lineStyle: { color: '#ff6b6b' },
                itemStyle: { color: '#ff6b6b' }
            },
            {
                name: '评论数',
                type: 'line',
                data: comments,
                smooth: true,
                lineStyle: { color: '#4ecdc4' },
                itemStyle: { color: '#4ecdc4' }
            },
            {
                name: '私信数',
                type: 'line',
                data: messages,
                smooth: true,
                lineStyle: { color: '#45b7d1' },
                itemStyle: { color: '#45b7d1' }
            },
            {
                name: '阅读/播放量',
                type: 'line',
                data: views,
                smooth: true,
                lineStyle: { color: '#f9ca24' },
                itemStyle: { color: '#f9ca24' }
            }
        ]
    };
    
    try {
        metricsChart.setOption(option, true); // 第二个参数为true表示不合并，完全替换
        
        // 确保图表正确渲染
        setTimeout(() => {
            if (metricsChart) {
                metricsChart.resize();
            }
        }, 100);
    } catch (error) {
        console.error('设置图表选项失败:', error);
        chartContainer.innerHTML = '<div class="alert alert-danger">图表渲染失败，请重试</div>';
    }
}

// 保存所有数据
async function saveAllMetrics() {
    if (metricsData.length === 0) {
        showAlert('没有数据需要保存', 'info');
        return;
    }
    
    try {
        const response = await fetch('core/api.php?action=batch_update_metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                work_id: currentWorkId,
                metrics: metricsData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('数据保存成功', 'success');
            loadWorks(); // 重新加载作品列表以更新统计数据
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('保存数据失败:', error);
        showAlert('保存数据失败: ' + error.message, 'danger');
    }
}

// 初始化图表
function initializeChart() {
    const chartContainer = document.getElementById('metricsChart');
    
    if (!chartContainer) {
        console.error('图表容器不存在');
        return;
    }
    
    // 检查ECharts是否已加载
    if (typeof echarts === 'undefined') {
        console.error('ECharts库未加载');
        chartContainer.innerHTML = '<div class="alert alert-warning text-center">图表库加载失败，请刷新页面重试</div>';
        return;
    }
    
    try {
        // 销毁现有图表实例
        if (metricsChart) {
            metricsChart.dispose();
            metricsChart = null;
        }
        
        // 重新初始化图表
        metricsChart = echarts.init(chartContainer);
        
        // 如果有数据，立即更新图表
        if (metricsData.length > 0) {
            updateMetricsChart();
        } else {
            // 显示空状态
            const option = {
                title: {
                    text: '暂无数据',
                    left: 'center',
                    top: 'middle',
                    textStyle: {
                        fontSize: 18,
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
                            fontSize: 14,
                            fill: '#999'
                        }
                    }]
                }
            };
            metricsChart.setOption(option);
        }
        
        console.log('图表初始化成功');
    } catch (error) {
        console.error('初始化图表失败:', error);
        chartContainer.innerHTML = '<div class="alert alert-danger text-center">图表初始化失败，请重试</div>';
    }
}

// 重置日期范围
function resetDateRange() {
    const work = currentWorks.find(w => parseInt(w.id) === parseInt(currentWorkId));
    if (work) {
        const workDate = new Date(work.created_at);
        const today = new Date();
        
        document.getElementById('metricsStartDate').value = workDate.toISOString().split('T')[0];
        document.getElementById('metricsEndDate').value = today.toISOString().split('T')[0];
        
        loadMetricsGrid();
    }
}

// 保存单行数据
async function saveRowMetrics(date) {
    const row = document.getElementById(`metrics-row-${date}`);
    const saveBtn = document.getElementById(`save-btn-${date}`);
    
    if (!row) {
        showAlert('找不到对应的数据行', 'warning');
        return;
    }
    
    // 获取该行的数据
    const likes = parseInt(row.querySelector('[data-field="likes"]').value) || 0;
    const comments = parseInt(row.querySelector('[data-field="comments"]').value) || 0;
    const messages = parseInt(row.querySelector('[data-field="messages"]').value) || 0;
    const views = parseInt(row.querySelector('[data-field="views"]').value) || 0;
    
    try {
        // 更新按钮状态
        saveBtn.innerHTML = '<div class="spinner-border spinner-border-sm"></div>';
        saveBtn.disabled = true;
        
        const response = await fetch('core/api.php?action=update_work_daily_metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                work_id: currentWorkId,
                date: date,
                likes: likes,
                comments: comments,
                messages: messages,
                views: views
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 标记行为已保存
            row.classList.add('metrics-row-saved');
            saveBtn.innerHTML = '✓';
            saveBtn.className = 'btn btn-outline-success btn-sm metrics-save-btn';
            
            // 2秒后恢复按钮状态
            setTimeout(() => {
                saveBtn.innerHTML = '保存';
                saveBtn.className = 'btn btn-success btn-sm metrics-save-btn';
                saveBtn.disabled = false;
                row.classList.remove('metrics-row-saved');
            }, 2000);
            
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('保存数据失败:', error);
        showAlert('保存数据失败: ' + error.message, 'danger');
        
        // 恢复按钮状态
        saveBtn.innerHTML = '保存';
        saveBtn.disabled = false;
    }
}

// 窗口大小改变时重新调整图表
window.addEventListener('resize', function() {
    if (metricsChart) {
        metricsChart.resize();
    }
});