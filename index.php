<?php
// 检测移动设备并重定向
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isMobile = preg_match('/(android|iphone|ipad|mobile)/i', $userAgent);

if ($isMobile) {
    header('Location: mobile.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>作品数据追踪与管理系统</title>
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- 侧边栏 -->
            <nav class="col-md-3 col-lg-2 d-md-block bg-light sidebar">
                <div class="position-sticky pt-3">
                    <h5 class="sidebar-heading">账号管理</h5>
                    <ul class="nav flex-column" id="accountsList">
                        <!-- 动态加载账号列表 -->
                    </ul>
                    <hr>
                    <button class="btn btn-primary btn-sm w-100 mb-2" onclick="showAddAccountModal()">
                        + 添加新账号
                    </button>
                    <button class="btn btn-outline-secondary btn-sm w-100" onclick="showCategoriesModal()">
                        管理分类
                    </button>
                </div>
            </nav>

            <!-- 主内容区 -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">作品数据管理</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <div class="btn-group me-2">
                            <button class="btn btn-sm btn-outline-secondary" onclick="filterWorks('today')">今天</button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="filterWorks('week')">本周</button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="filterWorks('month')">本月</button>
                        </div>
                    </div>
                </div>

                <!-- 搜索和筛选 -->
                <div class="row mb-3">
                    <div class="col-md-6">
                        <input type="text" class="form-control" id="searchInput" placeholder="搜索作品标题...">
                    </div>
                    <div class="col-md-3">
                        <input type="date" class="form-control" id="startDate">
                    </div>
                    <div class="col-md-3">
                        <input type="date" class="form-control" id="endDate">
                    </div>
                </div>

                <!-- 作品列表 -->
                <div id="worksContainer">
                    <div class="text-center text-muted py-5">
                        <h5>请选择一个账号开始管理作品</h5>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- 模态框容器 -->
    <div id="modalContainer"></div>

    <!-- JavaScript -->
    <script src="assets/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/echarts.min.js"></script>
    <script src="assets/js/modal-manager.js"></script>
    <script src="assets/js/accounts.js"></script>
    <script src="assets/js/categories.js"></script>
    <script src="assets/js/work-actions.js"></script>
    <script src="assets/js/metrics-grid.js"></script>
    <script src="assets/js/main.js"></script>
</body>
</html>