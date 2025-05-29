import { _decorator, Component, Node, UITransform, view, Vec3, Layout, Size } from 'cc';
import { GlobalScaleManager } from '../GlobalScaleManager';
const { ccclass, property } = _decorator;

@ccclass('ResizableNode')
export class ResizableNode extends Component {
    @property
    maintainAspectRatio: boolean = true;

    @property
    minScale: number = 0.5;

    @property
    maxScale: number = 1.5;

    @property
    private scaleRatio: number = 0.9; // Tỷ lệ kích thước so với node cha

    @property
    private itemScaleRatio: number = 0.2; // Tỷ lệ kích thước item so với node cha

    @property
    private spacingRatio: number = 0.1; // Tỷ lệ khoảng cách giữa các item

    @property([Node])
    private dropTargets: Node[] = []; // Mảng các drop target

    @property
    private centerDropTargets: boolean = true; // Có căn giữa drop targets không

    @property
    private dropTargetScaleRatio: number = 0.15; // Tỷ lệ kích thước drop target so với node cha

    @property
    private maxDropTargetsPerRow: number = 7; // Số lượng dropTargets tối đa trên một hàng

    private parentTransform: UITransform | null = null;
    private nodeTransform: UITransform | null = null;
    private originalSize: { width: number, height: number } | null = null;
    private originalScale: Vec3 | null = null;

    onLoad() {
        // Store original size and scale
        const uiTransform = this.getComponent(UITransform);
        if (uiTransform) {
            this.originalSize = {
                width: uiTransform.contentSize.width,
                height: uiTransform.contentSize.height
            };
        }
        this.originalScale = this.node.scale.clone();
        // Lấy component UITransform của node cha và node hiện tại
        this.parentTransform = this.node.parent?.getComponent(UITransform);
        this.nodeTransform = this.node.getComponent(UITransform);

        if (!this.parentTransform || !this.nodeTransform) {
            console.error('[ResizableNode] Missing UITransform component');
            return;
        }
        // Đăng ký sự kiện global scale changed
        if (GlobalScaleManager.instance) {
            GlobalScaleManager.instance.node.on('global-scale-changed', this.onGlobalScaleChanged, this);
        }
        // Resize lần đầu
        this.onResized();
    }

    onResized() {
        if (!this.originalSize || !this.originalScale) return;

        const globalScale = GlobalScaleManager.instance?.getCurrentScale() || 1;
        
        // Áp dụng scale
        this.node.setScale(
            this.originalScale.x * globalScale,
            this.originalScale.y * globalScale,
            this.originalScale.z
        );

        // Tính toán kích thước cho các item con
        const itemWidth = this.originalSize.width * this.itemScaleRatio;
        const itemHeight = this.maintainAspectRatio ? itemWidth : this.originalSize.height * this.itemScaleRatio;

        // Nếu node KHÔNG có Layout thì mới resize các node con
        if (!this.node.getComponent(Layout)) {
            this.node.children.forEach(childNode => {
                const childTransform = childNode.getComponent(UITransform);
                if (childTransform) {
                    childTransform.contentSize = new Size(itemWidth, itemHeight);
                }
            });
        }

        // Cập nhật layout nếu có
        const layout = this.node.getComponent(Layout);
        if (layout) {
            layout.spacingX = itemWidth * this.spacingRatio;
            layout.spacingY = itemHeight * this.spacingRatio;
        }

        // Xử lý drop targets
        this.resizeDropTargets();
    }

    private onGlobalScaleChanged(scale: number) {
        this.onResized();
    }

    private resizeDropTargets() {
        if (!this.dropTargets.length || !this.centerDropTargets) return;

        const globalScale = GlobalScaleManager.instance?.getCurrentScale() || 1;
        const parentSize = this.parentTransform?.contentSize;
        if (!parentSize) return;

        // Tính toán số hàng cần thiết
        const numRows = Math.ceil(this.dropTargets.length / this.maxDropTargetsPerRow);
        
        // Tính toán kích thước tối đa cho mỗi drop target
        const maxTargetWidth = (parentSize.width * 0.9) / this.maxDropTargetsPerRow;
        const maxTargetHeight = (parentSize.height * 0.4) / numRows;
        
        // Chọn kích thước nhỏ hơn để đảm bảo không bị tràn
        const targetWidth = Math.min(
            maxTargetWidth,
            maxTargetHeight * (this.maintainAspectRatio ? 1 : 0.8)
        );
        const targetHeight = this.maintainAspectRatio ? targetWidth : maxTargetHeight;

        // Tính toán khoảng cách giữa các drop target
        const spacing = targetWidth * this.spacingRatio;

        // Tính toán vị trí bắt đầu để căn giữa
        const totalWidth = (targetWidth * this.maxDropTargetsPerRow) + 
                          (spacing * (this.maxDropTargetsPerRow - 1));
        const startX = -totalWidth / 2 + targetWidth / 2;
        
        // Tính toán vị trí bắt đầu theo chiều dọc
        const totalHeight = (targetHeight * numRows) + (spacing * (numRows - 1));
        const startY = totalHeight / 2 - targetHeight / 2;

        // Cập nhật kích thước và vị trí cho từng drop target
        this.dropTargets.forEach((target, index) => {
            if (!target) return;

            const row = Math.floor(index / this.maxDropTargetsPerRow);
            const col = index % this.maxDropTargetsPerRow;

            const targetTransform = target.getComponent(UITransform);
            if (targetTransform) {
                targetTransform.contentSize = new Size(targetWidth, targetHeight);
            }

            // Tính toán vị trí mới
            const x = startX + col * (targetWidth + spacing);
            const y = startY - row * (targetHeight + spacing);
            const z = target.getPosition().z;
            target.setPosition(new Vec3(x, y, z));
        });
    }

    onDestroy() {
        if (GlobalScaleManager.instance) {
            GlobalScaleManager.instance.node.off('global-scale-changed', this.onGlobalScaleChanged, this);
        }
    }
} 