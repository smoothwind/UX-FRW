---
'@ux/services': minor
---

feat(services): PlatformAdapter 新增窗口材质与 OS 通知身份扩展位（改进提案 P2-2）

- applyWindowMaterial({ effect: 'acrylic'|'mica'|'blur'|'none', tint?, dark? })：原生窗口材质，'none' 为不支持透明环境的统一降级出口（§11.5）
- registerToastIdentity({ id, displayName, iconUri? })：OS 通知身份注册（Windows AUMID），避免 dev/便携来源显示宿主进程名、安装版静默失败（§11.6）
- 设计文档 §11 新增三节 Windows 实测模式：DWM 圆角与亚克力（SetWindowRgn 不生效）、Toast AUMID、多显示器坐标校验（§11.5–11.7）；§6.2 契约草图同步对齐
- 两扩展位均为可选方法：web 宿主无需实现；桌面宿主（Tauri/Electron）各自实现底层调用
