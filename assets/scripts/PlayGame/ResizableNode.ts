import { _decorator, Component, Node, UITransform, Size, view, Layout, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ResizableNode')
export class ResizableNode extends Component {
    @property
    private scaleRatio: number = 0.9; // Tỷ lệ kích thước so với node cha

    @property
    private itemScaleRatio: number = 0.2; // Tỷ lệ kích thước item so với node cha

    @property
    private maintainAspectRatio: boolean = true; // Có giữ tỷ lệ khung hình không

    @property
    private spacingRatio: number = 0.1; // Tỷ lệ khoảng cách giữa các item

    @property([Node])
    private dropTargets: Node[] = []; // Mảng các drop target

    @property
    private centerDropTargets: boolean = true; // Có căn giữa drop targets không

    @property
    private dropTargetScaleRatio: number = 0.15; // Tỷ lệ kích thước drop target so với node cha

    private parentTransform: UITransform | null = null;
    private nodeTransform: UITransform | null = null;

    onLoad() {
        // Lấy component UITransform của node cha và node hiện tại
        this.parentTransform = this.node.parent?.getComponent(UITransform);
        this.nodeTransform = this.node.getComponent(UITransform);

        if (!this.parentTransform || !this.nodeTransform) {
            console.error('[ResizableNode] Missing UITransform component');
            return;
        }

        // Thêm event listener cho việc thay đổi kích thước canvas
        view.on('canvas-resize', this.onCanvasResize, this);

        // Resize lần đầu khi component được load
        this.resize();
    }

    private onCanvasResize() {
        this.resize();
    }

    private resize() {
        if (!this.parentTransform || !this.nodeTransform) return;

        const parentWidth = this.parentTransform.contentSize.width;
        const parentHeight = this.parentTransform.contentSize.height;

        // Tính toán kích thước mới cho node
        const newWidth = parentWidth * this.scaleRatio;
        const newHeight = this.maintainAspectRatio ? newWidth : parentHeight * this.scaleRatio;

        // Cập nhật kích thước cho node
        this.nodeTransform.contentSize = new Size(newWidth, newHeight);

        // Tính toán kích thước cho các item con
        const itemWidth = parentWidth * this.itemScaleRatio;
        const itemHeight = this.maintainAspectRatio ? itemWidth : parentHeight * this.itemScaleRatio;

        // Cập nhật kích thước cho tất cả các item con
        this.node.children.forEach(childNode => {
            const childTransform = childNode.getComponent(UITransform);
            if (childTransform) {
                childTransform.contentSize = new Size(itemWidth, itemHeight);
            }
        });

        // Cập nhật layout nếu có
        const layout = this.node.getComponent(Layout);
        if (layout) {
            layout.spacingX = itemWidth * this.spacingRatio;
            layout.spacingY = itemHeight * this.spacingRatio;
        }

        // Xử lý drop targets
        this.resizeDropTargets(parentWidth, parentHeight);
    }

    private resizeDropTargets(parentWidth: number, parentHeight: number) {
        if (!this.dropTargets.length || !this.centerDropTargets) return;

        // Tính toán kích thước cho drop targets
        const targetWidth = parentWidth * this.dropTargetScaleRatio;
        const targetHeight = this.maintainAspectRatio ? targetWidth : parentHeight * this.dropTargetScaleRatio;

        // Tính toán vị trí để căn giữa các drop targets
        const totalWidth = targetWidth * this.dropTargets.length + 
                          (targetWidth * this.spacingRatio) * (this.dropTargets.length - 1);
        const startX = -totalWidth / 2 + targetWidth / 2;

        // Cập nhật kích thước và vị trí cho từng drop target
        this.dropTargets.forEach((target, index) => {
            if (!target) return;

            const targetTransform = target.getComponent(UITransform);
            if (targetTransform) {
                targetTransform.contentSize = new Size(targetWidth, targetHeight);
            }

            // Tính toán vị trí mới để căn giữa
            const x = startX + index * (targetWidth + targetWidth * this.spacingRatio);
            const y = target.getPosition().y;
            const z = target.getPosition().z;
            target.setPosition(new Vec3(x, y, z));
        });
    }

    onDestroy() {
        // Remove canvas resize listener
        view.off('canvas-resize', this.onCanvasResize, this);
    }
} 