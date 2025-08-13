// 作品操作功能

// 图片压缩功能
function compressImage(file, maxWidth = 800, maxHeight = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            let { width, height } = img;
            
            // 如果图片太大，按比例缩放
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            
            // 设置canvas尺寸
            canvas.width = width;
            canvas.height = height;
            
            // 使用高质量的图像缩放
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // 绘制压缩后的图片
            ctx.drawImage(img, 0, 0, width, height);
            
            // 转换为blob，使用JPEG格式以获得更好的压缩率
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('图片压缩失败'));
                }
            }, 'image/jpeg', quality);
        };
        
        img.onerror = function() {
            reject(new Error('图片加载失败'));
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// 智能提取文件名中的标题
function extractTitleFromFileName(fileName) {
    if (!fileName) return '';
    
    let cleanTitle = fileName;
    
    // 移除常见的文件名前缀和时间戳
    const patterns = [
        /^\d{8}_\d{6}_\d+_?/,           // YYYYMMDD_HHMMSS_毫秒
        /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_?/, // YYYY-MM-DD_HH-MM-SS
        /^IMG_\d+_?/,                    // IMG_数字
        /^Screenshot_\d+_?/,             // Screenshot_数字
        /^微信图片_\d+_?/,               // 微信图片_数字
        /^QQ图片\d+_?/,                  // QQ图片数字
        /^Photo_\d+_?/,                  // Photo_数字
        /^image_\d+_?/i,                 // image_数字
        /^pic_\d+_?/i,                   // pic_数字
        /^\d{13,}_?/,                    // 13位以上的时间戳
        /^WechatIMG\d+_?/,               // WechatIMG数字
        /^mmexport\d+_?/,                // mmexport数字（微信导出）
    ];
    
    // 应用所有模式
    patterns.forEach(pattern => {
        cleanTitle = cleanTitle.replace(pattern, '');
    });
    
    // 清理特殊字符和格式
    cleanTitle = cleanTitle
        .replace(/[_-]+/g, ' ')          // 将下划线和连字符替换为空格
        .replace(/\s+/g, ' ')            // 合并多个空格
        .replace(/^\s*[\(\[\{]/, '')     // 移除开头的括号
        .replace(/[\)\]\}]\s*$/, '')     // 移除结尾的括号
        .trim();
    
    // 如果清理后的标题太短或为空，尝试其他策略
    if (cleanTitle.length < 2) {
        // 尝试从原文件名中提取有意义的部分
        const meaningfulParts = fileName.split(/[_\-\s]+/).filter(part => {
            return part.length > 1 && 
                   !/^\d+$/.test(part) && 
                   !/(jpg|jpeg|png|gif|webp|bmp)$/i.test(part);
        });
        
        if (meaningfulParts.length > 0) {
            cleanTitle = meaningfulParts.join(' ');
        }
    }
    
    // 首字母大写
    if (cleanTitle) {
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }
    
    return cleanTitle;
}

// 显示添加作品模态框
function showAddWorkModal() {
    if (!currentAccountId) {
        showAlert('请先选择一个账号', 'warning');
        return;
    }
    
    const now = new Date();
    const defaultDateTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM格式
    
    const content = `
        <form id="addWorkForm" enctype="multipart/form-data">
            <div class="mb-3">
                <label class="form-label">作品标题</label>
                <input type="text" class="form-control" id="workTitle" required>
            </div>
            <div class="mb-3">
                <label class="form-label">发布时间</label>
                <input type="datetime-local" class="form-control" id="workPublishedAt" value="${defaultDateTime}" required>
                <div class="form-text">默认为当前时间，可以修改为实际发布时间</div>
            </div>
            <div class="mb-3">
                <label class="form-label">封面图片 (可选)</label>
                <div class="custom-file-upload">
                    <input type="file" class="d-none" id="workCover" accept="image/*">
                    <div class="upload-area" onclick="document.getElementById('workCover').click()">
                        <div class="upload-icon">📸</div>
                        <div class="upload-text">
                            <div class="upload-title">点击上传封面图片</div>
                            <div class="upload-subtitle">支持 JPEG、PNG、GIF、WebP 格式</div>
                            <div class="upload-subtitle">最大 10MB，系统会自动压缩</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mb-3" id="imagePreview" style="display: none;">
                <label class="form-label">预览</label>
                <div style="width: 180px;">
                    <img id="previewImg" src="" alt="预览" style="width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 0.25rem; border: 1px solid #dee2e6;">
                </div>
                <div id="compressionInfo" class="mt-2" style="display: none;">
                    <small class="text-muted">
                        <span id="compressionDetails"></span>
                    </small>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="submit" class="btn btn-primary">添加作品</button>
            </div>
        </form>
    `;
    
    ModalManager.show('添加新作品', content);
    
    // 绑定文件选择事件
    document.getElementById('workCover').addEventListener('change', handleImagePreview);
    
    // 绑定拖拽上传事件
    setupDragAndDrop();
    
    // 绑定表单提交事件
    document.getElementById('addWorkForm').addEventListener('submit', handleAddWork);
}

// 处理图片预览
async function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const titleInput = document.getElementById('workTitle');
    
    if (file) {
        // 检查文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showAlert('不支持的文件类型，请选择 JPEG、PNG、GIF 或 WebP 格式的图片', 'warning');
            e.target.value = '';
            preview.style.display = 'none';
            return;
        }
        
        // 检查文件大小
        if (file.size > 10 * 1024 * 1024) { // 增加到10MB，因为我们会压缩
            showAlert('文件大小不能超过 10MB', 'warning');
            e.target.value = '';
            preview.style.display = 'none';
            return;
        }
        
        // 自动填充作品标题（如果标题为空）
        if (!titleInput.value.trim()) {
            const fileName = file.name;
            // 移除文件扩展名
            const titleFromFile = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
            // 智能清理文件名
            const cleanTitle = extractTitleFromFileName(titleFromFile);
            
            if (cleanTitle) {
                titleInput.value = cleanTitle;
                titleInput.focus();
                titleInput.select(); // 选中文本，方便用户修改
                showAlert('已自动提取标题，图片正在压缩中...', 'info');
            }
        }
        
        // 更新上传区域状态
        updateUploadAreaState(file);
        
        try {
            // 压缩图片
            const compressedBlob = await compressImage(file);
            
            // 创建压缩后的文件对象
            const compressedFile = new File([compressedBlob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
            });
            
            // 保存压缩后的文件到input元素的自定义属性
            e.target.compressedFile = compressedFile;
            
            // 显示压缩信息
            const originalSize = (file.size / 1024).toFixed(1);
            const compressedSize = (compressedFile.size / 1024).toFixed(1);
            const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
            
            // 显示详细的压缩信息
            const compressionInfo = document.getElementById('compressionInfo');
            const compressionDetails = document.getElementById('compressionDetails');
            
            if (compressionInfo && compressionDetails) {
                compressionDetails.innerHTML = `
                    📸 原始大小: ${originalSize}KB<br>
                    🗜️ 压缩后: ${compressedSize}KB<br>
                    💾 节省空间: ${compressionRatio}%
                `;
                compressionInfo.style.display = 'block';
            }
            
            showAlert(`图片已压缩：${originalSize}KB → ${compressedSize}KB (节省${compressionRatio}%)`, 'success');
            
            // 显示预览
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(compressedBlob);
            
        } catch (error) {
            console.error('图片压缩失败:', error);
            showAlert('图片压缩失败，将使用原图', 'warning');
            
            // 如果压缩失败，使用原图
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    } else {
        preview.style.display = 'none';
    }
}

// 处理添加作品
async function handleAddWork(e) {
    e.preventDefault();
    
    const title = document.getElementById('workTitle').value.trim();
    const publishedAt = document.getElementById('workPublishedAt').value;
    const coverFile = document.getElementById('workCover').files[0];
    
    if (!title) {
        showAlert('请输入作品标题', 'warning');
        return;
    }
    
    if (!publishedAt) {
        showAlert('请选择发布时间', 'warning');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('account_id', currentAccountId);
        formData.append('published_at', publishedAt);
        
        if (coverFile) {
            // 使用压缩后的文件（如果存在），否则使用原文件
            const fileToUpload = document.getElementById('workCover').compressedFile || coverFile;
            formData.append('cover_image', fileToUpload);
        }
        
        const response = await fetch('core/api.php?action=add_work', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            ModalManager.hide();
            showAlert('作品添加成功', 'success');
            loadWorks(); // 重新加载作品列表
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('添加作品失败:', error);
        showAlert('添加作品失败: ' + error.message, 'danger');
    }
}

// 编辑作品
function editWork(workId) {
    const work = currentWorks.find(w => w.id === workId);
    if (!work) {
        showAlert('作品不存在', 'warning');
        return;
    }
    
    const content = `
        <form id="editWorkForm">
            <div class="mb-3">
                <label class="form-label">作品标题</label>
                <input type="text" class="form-control" id="editWorkTitle" value="${work.title}" required>
            </div>
            ${work.cover_image ? `
                <div class="mb-3">
                    <label class="form-label">当前封面</label>
                    <div style="width: 180px;">
                        <img src="${work.cover_image}" alt="当前封面" style="width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 0.25rem; border: 1px solid #dee2e6;">
                    </div>
                </div>
            ` : ''}
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="submit" class="btn btn-primary">保存修改</button>
            </div>
        </form>
    `;
    
    ModalManager.show('编辑作品', content);
    
    // 绑定表单提交事件
    document.getElementById('editWorkForm').addEventListener('submit', (e) => {
        handleEditWork(e, workId);
    });
}

// 处理编辑作品
async function handleEditWork(e, workId) {
    e.preventDefault();
    
    const title = document.getElementById('editWorkTitle').value.trim();
    
    if (!title) {
        showAlert('请输入作品标题', 'warning');
        return;
    }
    
    try {
        const response = await fetch('core/api.php?action=edit_work', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: workId,
                title: title
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            ModalManager.hide();
            showAlert('作品修改成功', 'success');
            loadWorks(); // 重新加载作品列表
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('修改作品失败:', error);
        showAlert('修改作品失败: ' + error.message, 'danger');
    }
}

// 设置拖拽上传功能
function setupDragAndDrop() {
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('workCover');
    
    if (!uploadArea || !fileInput) return;
    
    // 防止默认拖拽行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // 高亮拖拽区域
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // 处理文件拖拽
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight(e) {
        uploadArea.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            
            // 检查是否为图片文件
            if (file.type.startsWith('image/')) {
                // 创建一个新的FileList对象
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // 触发change事件
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
                
                // 更新UI状态
                updateUploadAreaState(file);
            } else {
                showAlert('请拖拽图片文件', 'warning');
            }
        }
    }
}

// 更新上传区域状态
function updateUploadAreaState(file) {
    const uploadArea = document.querySelector('.upload-area');
    const uploadIcon = document.querySelector('.upload-icon');
    const uploadTitle = document.querySelector('.upload-title');
    const uploadSubtitle = document.querySelectorAll('.upload-subtitle');
    
    if (uploadArea && file) {
        uploadArea.classList.add('has-file');
        if (uploadIcon) uploadIcon.textContent = '✅';
        if (uploadTitle) uploadTitle.textContent = `已选择: ${file.name}`;
        uploadSubtitle.forEach(subtitle => {
            subtitle.style.display = 'none';
        });
        
        // 添加一个新的提示
        if (!document.querySelector('.file-selected-info')) {
            const fileInfo = document.createElement('div');
            fileInfo.className = 'upload-subtitle file-selected-info';
            fileInfo.textContent = '点击可重新选择文件';
            uploadTitle.parentNode.appendChild(fileInfo);
        }
    }
}

// 删除作品
function deleteWork(workId) {
    const work = currentWorks.find(w => w.id === workId);
    if (!work) {
        showAlert('作品不存在', 'warning');
        return;
    }
    
    ModalManager.confirm(
        '删除作品',
        `确定要删除作品"${work.title}"吗？删除后所有相关数据都将被永久删除，此操作不可恢复。`,
        async () => {
            try {
                const response = await fetch(`core/api.php?action=delete_work&id=${workId}`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('作品删除成功', 'success');
                    loadWorks(); // 重新加载作品列表
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('删除作品失败:', error);
                showAlert('删除作品失败: ' + error.message, 'danger');
            }
        }
    );
}