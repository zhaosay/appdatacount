<?php
// 移动端页面
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>作品数据管理 - 移动版</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/mobile.css" rel="stylesheet">
</head>
<body>
    <!-- 顶部导航 -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">作品数据管理</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav" id="mobileAccountsList">
                    <!-- 动态加载账号列表 -->
                </ul>
            </div>
        </div>
    </nav>

    <!-- 主内容 -->
    <div class="container-fluid p-3">
        <!-- 快捷操作 -->
        <div class="row mb-3">
            <div class="col-6">
                <button class="btn btn-primary w-100" onclick="showAddAccountModal()">
                    + 添加账号
                </button>
            </div>
            <div class="col-6">
                <button class="btn btn-outline-primary w-100" onclick="showCategoriesModal()">
                    管理分类
                </button>
            </div>
        </div>

        <!-- 搜索 -->
        <div class="mb-3">
            <input type="text" class="form-control" id="mobileSearchInput" placeholder="搜索作品...">
        </div>

        <!-- 作品列表 -->
        <div id="mobileWorksContainer">
            <div class="text-center text-muted py-5">
                <h6>请选择一个账号开始管理作品</h6>
            </div>
        </div>
    </div>

    <!-- 模态框容器 -->
    <div id="modalContainer"></div>

    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <script src="assets/js/modal-manager.js"></script>
    <script src="assets/js/work-actions.js"></script>
    <script src="assets/js/accounts.js"></script>
    <script src="assets/js/categories.js"></script>
    <script src="assets/js/metrics-grid.js"></script>
    <script src="assets/js/mobile.js"></script>
</body>
</html>