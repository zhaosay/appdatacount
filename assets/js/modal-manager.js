// 模态框管理器
class ModalManager {
    static currentModal = null;
    
    // 显示模态框
    static show(title, content, size = 'modal-lg') {
        this.hide(); // 先关闭现有模态框
        
        const modalHtml = `
            <div class="modal fade" id="dynamicModal" tabindex="-1">
                <div class="modal-dialog ${size}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHtml;
        this.currentModal = new bootstrap.Modal(document.getElementById('dynamicModal'));
        this.currentModal.show();
        
        return this.currentModal;
    }
    
    // 隐藏模态框
    static hide() {
        if (this.currentModal) {
            this.currentModal.hide();
            this.currentModal = null;
        }
        document.getElementById('modalContainer').innerHTML = '';
    }
    
    // 显示确认对话框
    static confirm(title, message, onConfirm, onCancel = null) {
        const content = `
            <p>${message}</p>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="ModalManager.hide()">取消</button>
                <button type="button" class="btn btn-danger" onclick="ModalManager.handleConfirm()">确认</button>
            </div>
        `;
        
        this.confirmCallback = onConfirm;
        this.cancelCallback = onCancel;
        
        return this.show(title, content, 'modal-sm');
    }
    
    // 处理确认回调
    static handleConfirm() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.hide();
    }
    
    // 显示加载状态
    static showLoading(message = '处理中...') {
        const content = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary mb-3"></div>
                <p>${message}</p>
            </div>
        `;
        
        return this.show('请稍候', content, 'modal-sm');
    }
}

// 全局模态框函数
window.ModalManager = ModalManager;