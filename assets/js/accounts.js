// 账号管理功能

// 显示添加账号模态框
function showAddAccountModal() {
    const content = `
        <form id="addAccountForm">
            <div class="mb-3">
                <label class="form-label">账号名称</label>
                <input type="text" class="form-control" id="accountName" required>
            </div>
            <div class="mb-3">
                <label class="form-label">选择分类</label>
                <div class="category-radio-group">
                    ${accountCategories.map(cat => 
                        `<div class="form-check category-option">
                            <input class="form-check-input" type="radio" name="accountCategory" id="category_${cat.id}" value="${cat.id}" required>
                            <label class="form-check-label category-label" for="category_${cat.id}">
                                <span class="category-indicator" style="background-color: ${cat.color}"></span>
                                ${cat.name}
                            </label>
                        </div>`
                    ).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="submit" class="btn btn-primary">添加账号</button>
            </div>
        </form>
    `;
    
    ModalManager.show('添加新账号', content);
    
    // 绑定表单提交事件
    document.getElementById('addAccountForm').addEventListener('submit', handleAddAccount);
}

// 处理添加账号
async function handleAddAccount(e) {
    e.preventDefault();
    
    const name = document.getElementById('accountName').value.trim();
    const categoryRadio = document.querySelector('input[name="accountCategory"]:checked');
    const categoryId = categoryRadio ? categoryRadio.value : '';
    
    if (!name || !categoryId) {
        showAlert('请填写完整信息', 'warning');
        return;
    }
    
    try {
        const response = await fetch('core/api.php?action=add_account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                category_id: parseInt(categoryId)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            ModalManager.hide();
            showAlert('账号添加成功', 'success');
            loadAccounts(); // 重新加载账号列表
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('添加账号失败:', error);
        showAlert('添加账号失败: ' + error.message, 'danger');
    }
}

// 编辑账号
function editAccount(accountId) {
    // 从全局账号列表中找到要编辑的账号
    const account = allAccounts.find(acc => acc.id === accountId);
    
    if (!account) {
        showAlert('账号信息不存在', 'warning');
        return;
    }
    
    const content = `
        <form id="editAccountForm">
            <div class="mb-3">
                <label class="form-label">账号名称</label>
                <input type="text" class="form-control" id="editAccountName" value="${account.name}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">选择分类</label>
                <div class="category-radio-group">
                    ${accountCategories.map(cat => 
                        `<div class="form-check category-option">
                            <input class="form-check-input" type="radio" name="editAccountCategory" id="edit_category_${cat.id}" value="${cat.id}" ${cat.id === account.category_id ? 'checked' : ''} required>
                            <label class="form-check-label category-label" for="edit_category_${cat.id}">
                                <span class="category-indicator" style="background-color: ${cat.color}"></span>
                                ${cat.name}
                            </label>
                        </div>`
                    ).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="submit" class="btn btn-primary">保存修改</button>
            </div>
        </form>
    `;
    
    ModalManager.show('编辑账号', content);
    
    // 绑定表单提交事件
    document.getElementById('editAccountForm').addEventListener('submit', (e) => {
        handleEditAccount(e, accountId);
    });
}

// 处理编辑账号
async function handleEditAccount(e, accountId) {
    e.preventDefault();
    
    const name = document.getElementById('editAccountName').value.trim();
    const categoryRadio = document.querySelector('input[name="editAccountCategory"]:checked');
    const categoryId = categoryRadio ? categoryRadio.value : '';
    
    if (!name || !categoryId) {
        showAlert('请填写完整信息', 'warning');
        return;
    }
    
    try {
        const response = await fetch('core/api.php?action=edit_account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: accountId,
                name: name,
                category_id: parseInt(categoryId)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            ModalManager.hide();
            showAlert('账号修改成功', 'success');
            loadAccounts(); // 重新加载账号列表
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('修改账号失败:', error);
        showAlert('修改账号失败: ' + error.message, 'danger');
    }
}

// 删除账号
function deleteAccount(accountId) {
    ModalManager.confirm(
        '删除账号',
        '确定要删除这个账号吗？删除后所有相关作品和数据都将被永久删除，此操作不可恢复。',
        async () => {
            try {
                const response = await fetch(`core/api.php?action=delete_account&id=${accountId}`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('账号删除成功', 'success');
                    
                    // 如果删除的是当前选中的账号，清空作品列表
                    if (currentAccountId === accountId) {
                        currentAccountId = null;
                        document.getElementById('worksContainer').innerHTML = `
                            <div class="text-center text-muted py-5">
                                <h5>请选择一个账号开始管理作品</h5>
                            </div>
                        `;
                    }
                    
                    loadAccounts(); // 重新加载账号列表
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('删除账号失败:', error);
                showAlert('删除账号失败: ' + error.message, 'danger');
            }
        }
    );
}