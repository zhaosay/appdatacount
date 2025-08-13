<?php
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        $dbPath = __DIR__ . '/../data/db.sqlite';
        $dbDir = dirname($dbPath);
        
        // 确保数据目录存在
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }
        
        try {
            $this->pdo = new PDO("sqlite:$dbPath");
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // 启用外键约束
            $this->pdo->exec('PRAGMA foreign_keys = ON');
        } catch (PDOException $e) {
            die('数据库连接失败: ' . $e->getMessage());
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
    
    public function createTables() {
        $sql = "
        -- 账号分类表
        CREATE TABLE IF NOT EXISTS account_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL DEFAULT '#20c997',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 账号表
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES account_categories(id)
        );
        
        -- 作品表
        CREATE TABLE IF NOT EXISTS works (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            cover_image TEXT,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        );
        
        -- 作品每日数据表
        CREATE TABLE IF NOT EXISTS work_daily_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_id INTEGER NOT NULL,
            date DATE NOT NULL,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            messages INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
            UNIQUE(work_id, date)
        );
        
        -- 每日备注表
        CREATE TABLE IF NOT EXISTS daily_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_id INTEGER NOT NULL,
            date DATE NOT NULL,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
            UNIQUE(work_id, date)
        );
        
        -- 标签表
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT DEFAULT '#6c757d',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 作品标签关联表
        CREATE TABLE IF NOT EXISTS work_tags (
            work_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (work_id, tag_id),
            FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );
        
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_works_account_id ON works(account_id);
        CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at);
        CREATE INDEX IF NOT EXISTS idx_daily_metrics_work_date ON work_daily_metrics(work_id, date);
        CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON work_daily_metrics(date);
        ";
        
        $this->pdo->exec($sql);
        
        // 升级数据库结构
        $this->upgradeDatabase();
        
        // 插入默认分类
        $this->insertDefaultCategories();
    }
    
    private function upgradeDatabase() {
        try {
            // 检查 works 表是否有 published_at 字段
            $stmt = $this->pdo->prepare("PRAGMA table_info(works)");
            $stmt->execute();
            $columns = $stmt->fetchAll();
            
            $hasPublishedAt = false;
            foreach ($columns as $column) {
                if ($column['name'] === 'published_at') {
                    $hasPublishedAt = true;
                    break;
                }
            }
            
            // 如果没有 published_at 字段，则添加
            if (!$hasPublishedAt) {
                $this->pdo->exec("ALTER TABLE works ADD COLUMN published_at DATETIME DEFAULT CURRENT_TIMESTAMP");
                // 将现有记录的 published_at 设置为 created_at 的值
                $this->pdo->exec("UPDATE works SET published_at = created_at WHERE published_at IS NULL");
            }
        } catch (PDOException $e) {
            // 如果升级失败，记录错误但不中断程序
            error_log('数据库升级失败: ' . $e->getMessage());
        }
    }
    
    private function insertDefaultCategories() {
        $categories = [
            ['name' => '小红书', 'color' => '#ff2442'],
            ['name' => '快手', 'color' => '#ff6600'],
            ['name' => '抖音', 'color' => '#000000']
        ];
        
        $stmt = $this->pdo->prepare("INSERT OR IGNORE INTO account_categories (name, color) VALUES (?, ?)");
        
        foreach ($categories as $category) {
            $stmt->execute([$category['name'], $category['color']]);
        }
    }
}
?>