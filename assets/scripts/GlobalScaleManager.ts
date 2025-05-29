import { _decorator, Component, Node, view, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GlobalScaleManager')
export class GlobalScaleManager extends Component {
    public static instance: GlobalScaleManager = null;

    @property
    maintainAspectRatio: boolean = true;

    @property
    minScale: number = 0.5;

    @property
    maxScale: number = 1.5;

    private currentScale: number = 1;

    onLoad() {
        if (GlobalScaleManager.instance) {
            this.node.destroy();
            return;
        }
        GlobalScaleManager.instance = this;
        
        // Lưu scale ban đầu
        this.currentScale = this.node.scale.x;
        
        // Đăng ký sự kiện resize
        view.on('canvas-resize', this.onResized, this);
        
        // Scale lần đầu
        this.onResized();
    }

    onResized() {
        const canvasSize = view.getVisibleSize();
        const designSize = view.getDesignResolutionSize();
        
        // Tính toán scale factor
        const scaleX = canvasSize.width / designSize.width;
        const scaleY = canvasSize.height / designSize.height;
        let scale = this.maintainAspectRatio ? 
            Math.min(scaleX, scaleY) : 
            Math.max(scaleX, scaleY);

        // Giới hạn scale trong khoảng min và max
        scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
        
        // Cập nhật scale hiện tại
        this.currentScale = scale;
        
        // Áp dụng scale cho node
        this.node.setScale(new Vec3(scale, scale, 1));
        
        // Emit event để các component khác có thể cập nhật
        this.node.emit('global-scale-changed', scale);
    }

    public getCurrentScale(): number {
        return this.currentScale;
    }

    onDestroy() {
        view.off('canvas-resize', this.onResized, this);
        if (GlobalScaleManager.instance === this) {
            GlobalScaleManager.instance = null;
        }
    }
} 