import { JsonAsset, Label, Node, resources } from 'cc';
export class I18n {
    static currentLang: string = 'english'; // Ngôn ngữ mặc định
    static translations: { [key: string]: string } = {}; // Lưu trữ bản dịch

    // Tải ngôn ngữ từ file JSON trong thư mục resources
    static async loadLanguage(langCode: string) {
        try {
            // Tải file JSON từ thư mục resources
            const { data } = await new Promise<{ data: JsonAsset }>((resolve, reject) => {
                resources.load(`i18n/${langCode}`, JsonAsset, (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: res });
                    }
                });
            });

            // Lưu dữ liệu ngôn ngữ vào translations
            this.translations = data.json;  // `data.json` chứa dữ liệu JSON từ file
            this.currentLang = langCode;  // Cập nhật ngôn ngữ hiện tại
        } catch (error) {
            console.error(`Không thể tải ngôn ngữ ${langCode}`, error);
        }
    }

    // Lấy bản dịch cho key
    static t(key: string): string {
        return this.translations[key] || key; // Trả về key nếu không có bản dịch
    }

    // Cập nhật tất cả label trong scene
    static updateAllLabels(scene: Node) {
        scene.children.forEach(child => {
            const label = child.getComponent(Label);
            if (label) {
                label.string = this.t(child.name); // Cập nhật nội dung label
            }

            // Đệ quy cho các node con
            if (child.children.length > 0) {
                this.updateAllLabels(child);
            }
        });
    }
}

