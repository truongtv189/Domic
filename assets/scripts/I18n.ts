import { JsonAsset, Label, Node, resources } from 'cc';
export class I18n {
    static currentLang: string = 'english'; // Ngôn ngữ mặc định
    static translations: { [key: string]: string } = {}; // Lưu trữ bản dịch

    // Khởi tạo ngôn ngữ mặc định
    static async initialize() {
        await this.loadLanguage(this.currentLang);
    }

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

    // Kiểm tra xem key có tồn tại trong translations không
    static hasKey(key: string): boolean {
        return key in this.translations;
    }

    // Lấy bản dịch cho key
    static t(key: string): string {
        // Nếu key không tồn tại trong translations, trả về key gốc
        if (!this.hasKey(key)) {
            return key;
        }
        return this.translations[key];
    }

    // Cập nhật tất cả label trong scene
    static updateAllLabels(scene: Node) {
        scene.children.forEach(child => {
            const label = child.getComponent(Label);
            if (label) {
                // Chỉ cập nhật label nếu key tồn tại trong translations
                if (this.hasKey(child.name)) {
                    label.string = this.t(child.name);
                }
            }

            // Đệ quy cho các node con
            if (child.children.length > 0) {
                this.updateAllLabels(child);
            }
        });
    }
}

