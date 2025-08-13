<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'database.php';

class API {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                // 账号管理
                case 'get_accounts':
                    return $this->getAccounts();
                case 'add_account':
                    return $this->addAccount();
                case 'edit_account':
                    return $this->editAccount();
                case 'delete_account':
                    return $this->deleteAccount();
                
                // 分类管理
                case 'get_account_categories':
                    return $this->getAccountCategories();
                case 'add_account_category':
                    return $this->addAccountCategory();
                case 'edit_account_category':
                    return $this->editAccountCategory();
                case 'delete_account_category':
                    return $this->deleteAccountCategory();
                
                // 作品管理
                case 'get_works_with_daily_metrics':
                    return $this->getWorksWithDailyMetrics();
                case 'add_work':
                    return $this->addWork();
                case 'edit_work':
                    return $this->editWork();
                case 'delete_work':
                    return $this->deleteWork();
                
                // 数据管理
                case 'get_work_metrics_grid_by_range':
                    return $this->getWorkMetricsGridByRange();
                case 'batch_update_metrics':
                    return $this->batchUpdateMetrics();
                case 'update_work_daily_metrics':
                    return $this->updateWorkDailyMetrics();
                
                default:
                    throw new Exception('未知的操作');
            }
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }
    
    // 账号管理方法
    private function getAccounts() {
        $stmt = $this->db->prepare("
            SELECT a.*, c.name as category_name, c.color as category_color,
                   COUNT(w.id) as works_count
            FROM accounts a
            LEFT JOIN account_categories c ON a.category_id = c.id
            LEFT JOIN works w ON a.id = w.account_id
            GROUP BY a.id
            ORDER BY a.created_at DESC
        ");
        $stmt->execute();
        return $this->success($stmt->fetchAll());
    }
    
    private function addAccount() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $this->db->prepare("INSERT INTO accounts (name, category_id) VALUES (?, ?)");
        $stmt->execute([$data['name'], $data['category_id']]);
        
        return $this->success(['id' => $this->db->lastInsertId()]);
    }
    
    private function editAccount() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $this->db->prepare("UPDATE accounts SET name = ?, category_id = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['category_id'], $data['id']]);
        
        return $this->success();
    }
    
    private function deleteAccount() {
        $id = $_GET['id'] ?? 0;
        
        $stmt = $this->db->prepare("DELETE FROM accounts WHERE id = ?");
        $stmt->execute([$id]);
        
        return $this->success();
    }
    
    // 分类管理方法
    private function getAccountCategories() {
        $stmt = $this->db->prepare("SELECT * FROM account_categories ORDER BY created_at ASC");
        $stmt->execute();
        return $this->success($stmt->fetchAll());
    }
    
    private function addAccountCategory() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $this->db->prepare("INSERT INTO account_categories (name, color) VALUES (?, ?)");
        $stmt->execute([$data['name'], $data['color']]);
        
        return $this->success(['id' => $this->db->lastInsertId()]);
    }
    
    private function editAccountCategory() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $this->db->prepare("UPDATE account_categories SET name = ?, color = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['color'], $data['id']]);
        
        return $this->success();
    }
    
    private function deleteAccountCategory() {
        $id = $_GET['id'] ?? 0;
        
        $stmt = $this->db->prepare("DELETE FROM account_categories WHERE id = ?");
        $stmt->execute([$id]);
        
        return $this->success();
    }
    
    // 作品管理方法
    private function getWorksWithDailyMetrics() {
        $accountId = $_GET['account_id'] ?? 0;
        $search = $_GET['search'] ?? '';
        $startDate = $_GET['start_date'] ?? '';
        $endDate = $_GET['end_date'] ?? '';
        
        $sql = "
            SELECT w.*, 
                   MAX(wdm.likes) as max_likes,
                   MAX(wdm.comments) as max_comments,
                   MAX(wdm.messages) as max_messages,
                   MAX(wdm.views) as max_views,
                   COUNT(wdm.id) as metrics_count
            FROM works w
            LEFT JOIN work_daily_metrics wdm ON w.id = wdm.work_id
            WHERE w.account_id = ?
        ";
        
        $params = [$accountId];
        
        if ($search) {
            $sql .= " AND w.title LIKE ?";
            $params[] = "%$search%";
        }
        
        if ($startDate) {
            $sql .= " AND DATE(w.created_at) >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $sql .= " AND DATE(w.created_at) <= ?";
            $params[] = $endDate;
        }
        
        $sql .= " GROUP BY w.id ORDER BY w.created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $this->success($stmt->fetchAll());
    }
    
    private function addWork() {
        $title = $_POST['title'] ?? '';
        $accountId = $_POST['account_id'] ?? 0;
        $publishedAt = $_POST['published_at'] ?? date('Y-m-d H:i:s');
        $coverImage = '';
        
        // 处理文件上传
        if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
            $coverImage = $this->handleFileUpload($_FILES['cover_image'], $accountId);
        }
        
        $stmt = $this->db->prepare("INSERT INTO works (account_id, title, cover_image, published_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([$accountId, $title, $coverImage, $publishedAt]);
        
        return $this->success(['id' => $this->db->lastInsertId()]);
    }
    
    private function editWork() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $this->db->prepare("UPDATE works SET title = ? WHERE id = ?");
        $stmt->execute([$data['title'], $data['id']]);
        
        return $this->success();
    }
    
    private function deleteWork() {
        $id = $_GET['id'] ?? 0;
        
        $stmt = $this->db->prepare("DELETE FROM works WHERE id = ?");
        $stmt->execute([$id]);
        
        return $this->success();
    }
    
    // 数据管理方法
    private function getWorkMetricsGridByRange() {
        $workId = $_GET['work_id'] ?? 0;
        $startDate = $_GET['start_date'] ?? '';
        $endDate = $_GET['end_date'] ?? '';
        
        if (!$startDate || !$endDate) {
            throw new Exception('开始日期和结束日期不能为空');
        }
        
        $stmt = $this->db->prepare("
            SELECT date, likes, comments, messages, views
            FROM work_daily_metrics
            WHERE work_id = ? AND date BETWEEN ? AND ?
            ORDER BY date ASC
        ");
        $stmt->execute([$workId, $startDate, $endDate]);
        
        return $this->success($stmt->fetchAll());
    }
    
    private function batchUpdateMetrics() {
        $data = json_decode(file_get_contents('php://input'), true);
        $workId = $data['work_id'];
        $metrics = $data['metrics'];
        
        $this->db->beginTransaction();
        
        try {
            $stmt = $this->db->prepare("
                INSERT OR REPLACE INTO work_daily_metrics 
                (work_id, date, likes, comments, messages, views, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ");
            
            foreach ($metrics as $metric) {
                $stmt->execute([
                    $workId,
                    $metric['date'],
                    $metric['likes'],
                    $metric['comments'],
                    $metric['messages'],
                    $metric['views']
                ]);
            }
            
            $this->db->commit();
            return $this->success();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    private function updateWorkDailyMetrics() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $this->db->prepare("
            INSERT OR REPLACE INTO work_daily_metrics 
            (work_id, date, likes, comments, messages, views, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ");
        
        $stmt->execute([
            $data['work_id'],
            $data['date'],
            $data['likes'],
            $data['comments'],
            $data['messages'],
            $data['views']
        ]);
        
        return $this->success();
    }
    
    // 文件上传处理
    private function handleFileUpload($file, $accountId) {
        $uploadDir = __DIR__ . "/../uploads/covers/$accountId/";
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('不支持的文件类型');
        }
        
        if ($file['size'] > 3 * 1024 * 1024) { // 3MB，因为前端已经压缩过
            throw new Exception('压缩后的文件大小不能超过3MB');
        }
        
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = date('Ymd_His_') . substr(microtime(), 2, 3) . '.' . $extension;
        $filepath = $uploadDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            throw new Exception('文件上传失败');
        }
        
        return "uploads/covers/$accountId/$filename";
    }
    
    // 响应方法
    private function success($data = null) {
        return json_encode(['success' => true, 'data' => $data]);
    }
    
    private function error($message) {
        return json_encode(['success' => false, 'error' => $message]);
    }
}

// 处理请求
$api = new API();
echo $api->handleRequest();
?>