<?php
require_once 'core/database.php';

try {
    $db = Database::getInstance();
    $db->createTables();
    
    echo "<!DOCTYPE html>
    <html lang='zh-CN'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>数据库初始化</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { color: #28a745; background: #d4edda; padding: 15px; border-radius: 5px; }
            .info { color: #17a2b8; background: #d1ecf1; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <h1>数据库初始化成功！</h1>
        <div class='success'>
            ✅ 数据库表结构已创建<br>
            ✅ 默认分类已插入（小红书、快手、抖音）<br>
            ✅ 索引已创建<br>
            ✅ 外键约束已启用
        </div>
        
        <div class='info'>
            <h3>接下来您可以：</h3>
            <ul>
                <li>访问 <strong>index.php</strong> 开始使用桌面版</li>
                <li>访问 <strong>mobile.php</strong> 使用移动版</li>
                <li>添加账号和作品开始数据管理</li>
            </ul>
        </div>
        
        <a href='index.php' class='btn'>进入系统</a>
    </body>
    </html>";
    
} catch (Exception $e) {
    echo "<!DOCTYPE html>
    <html lang='zh-CN'>
    <head>
        <meta charset='UTF-8'>
        <title>数据库初始化失败</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { color: #dc3545; background: #f8d7da; padding: 15px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>数据库初始化失败</h1>
        <div class='error'>
            ❌ 错误信息：" . htmlspecialchars($e->getMessage()) . "
        </div>
    </body>
    </html>";
}
?>