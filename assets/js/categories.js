// 分类管理功能

// 显示分类管理模态框
function showCategoriesModal() {
    const content = `
        <div class="mb-3">
            <h6>现有分类</h6>
            <div id="categoriesList">
                ${renderCategoriesList()}
            </div>
        </div>
        
        <hr>
        
        <form id="addCategoryForm">
            <h6>添加新分类</h6>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">分类名称</label>
                    <input type="text" class="form-control" id="categoryName" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">分类颜色</label>
                    <input type="color" class="form-control form-control-color" id="categoryColor" value="#20c997">
                </div>
            </div>
            <div class="mt-3">
                <button type="submit" class="btn btn-primary">添加分类</button>
            </div>
        </form>
        
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
        </div>
    `;
    
    ModalManager.show('管理分类', content, 'modal-lg');
    
    // 绑定表单提交事件
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
}

// 渲染分类列表
function renderCategoriesList() {
    if (accountCategories.length === 0) {
        return '<p class="text-muted">暂无分类</p>';
    }
    
    return accountCategories.map(category => `
        <div class="d-flex align-items-center justify-content-between p-2 border rounded mb-2">
            <div class="d-flex align-items-center">
                <span class="category-indicator me-2" style="background-color: ${category.color}"></span>
                <span>${category.name}</span>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editCategory(${category.id})">
                    编辑
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})">
                    删除
                </button>
            </div>
        </div>
    `).join('');
}

// 处理添加分类
async function handleAddCategory(e) {
    e.preventDefault();
    
    const name = document.getElementById('categoryName').value.trim();
    const color = document.getElementById('categoryColor').value;
    
    if (!name) {
        showAlert('请输入分类名称', 'warning');
        return;
    }
    
    try {
        const response = await fetch('core/api.php?action=add_account_category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                color: color
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('分类添加成功', 'success');
            
            // 重新加载分类数据
            await loadAccountCategories();
            
            // 更新模态框内容
            document.getElementById('categoriesList').innerHTML = renderCategoriesList();
            
            // 清空表单
            document.getElementById('categoryName').value = '';
            document.getElementById('categoryColor').value = '#20c997';
            
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('添加分类失败:', error);
        showAlert('添加分类失败: ' + error.message, 'danger');
    }
}

// 编辑分类
function editCategory(categoryId) {
    const category = accountCategories.find(cat => cat.id === categoryId);
    if (!category) {
        showAlert('分类不存在', 'warning');
        return;
    }
    
    const content = `
        <form id="editCategoryForm">
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">分类名称</label>
                    <input type="text" class="form-control" id="editCategoryName" value="${category.name}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">分类颜色</label>
                    <input type="color" class="form-control form-control-color" id="editCategoryColor" value="${category.color}">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="submit" class="btn btn-primary">保存修改</button>
            </div>
        </form>
    `;
    
    ModalManager.show('编辑分类', content);
    
    // 绑定表单提交事件
    document.getElementById('editCategoryForm').addEventListener('submit', (e) => {
        handleEditCategory(e, categoryId);
    });
}

// 处理编辑分类
async function handleEditCategory(e, categoryId) {
    e.preventDefault();
    
    const name = document.getElementById('editCategoryName').value.trim();
    const color = document.getElementById('editCategoryColor').value;
    
    if (!name) {
        showAlert('请输入分类名称', 'warning');
        return;
    }
    
    try {
        const response = await fetch('core/api.php?action=edit_account_category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: categoryId,
                name: name,
                color: color
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            ModalManager.hide();
            showAlert('分类修改成功', 'success');
            
            // 重新加载分类和账号数据
            await loadAccountCategories();
            loadAccounts();
            
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('修改分类失败:', error);
        showAlert('修改分类失败: ' + error.message, 'danger');
    }
}

// 删除分类
function deleteCategory(categoryId) {
    ModalManager.confirm(
        '删除分类',
        '确定要删除这个分类吗？删除后该分类下的所有账号将变为未分类状态。',
        async () => {
            try {
                const response = await fetch(`core/api.php?action=delete_account_category&id=${categoryId}`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('分类删除成功', 'success');
                    
                    // 重新加载分类和账号数据
                    await loadAccountCategories();
                    loadAccounts();
                    
                    // 如果模态框还在显示，更新内容
                    const categoriesList = document.getElementById('categoriesList');
                    if (categoriesList) {
                        categoriesList.innerHTML = renderCategoriesList();
                    }
                    
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('删除分类失败:', error);
                showAlert('删除分类失败: ' + error.message, 'danger');
            }
        }
    );
}