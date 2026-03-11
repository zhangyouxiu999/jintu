# 文档索引

本目录及项目内所有 `.md` 文档的整理与导航。

---

## 一、根目录文档

| 文件 | 说明 |
|------|------|
| [../README.md](../README.md) | 项目入口：简介、本地运行、商用部署、打包与分发链接 |
| [../从0到落地步骤.md](../从0到落地步骤.md) | 从零搭建到上架的全阶段步骤（阶段一～八）；当前数据层已实现为 localStorage，与文中 SQLite 可选方案并存 |
| [../ANDROID_BUILD.md](../ANDROID_BUILD.md) | Android 打包主文档：环境、JDK/SDK、日常流程、APK 输出位置、分发方式 |
| [../IOS_BUILD.md](../IOS_BUILD.md) | iOS 打包：环境、CocoaPods、Xcode 流程、免费/付费账号说明、PWA 等替代方式 |

---

## 二、商用与运营（docs/）

| 文件 | 说明 |
|------|------|
| [商用化路线图.md](./商用化路线图.md) | 商用化阶段概览：安全与配置、售卖账号、合规、数据上云（可选） |
| [售卖账号模式说明.md](./售卖账号模式说明.md) | 两种卖法（一客户一包 / 通用包+多账号）、防 APK 转发（账号与设备绑定） |
| [App更新与数据保留.md](./App更新与数据保留.md) | 覆盖安装时数据保留、包名/存储键约定、可选数据版本与迁移 |

---

## 三、打包与构建（docs/）

| 文件 | 说明 |
|------|------|
| [带签证打包-Android.md](./带签证打包-Android.md) | Android Release 签名：keystore 配置、keytool、打包命令、常见报错 |
| [ANDROID-兼容性.md](./ANDROID-兼容性.md) | Android 兼容性：返回键、剪贴板、导出、安全区、存储等已适配项 |

---

## 四、历史检查与报告（docs/）

| 文件 | 说明 |
|------|------|
| [项目与文档符合性检查.md](./项目与文档符合性检查.md) | 项目实现与 README、商用化、售卖账号、App 更新、Android/iOS 文档的逐项符合性检查结果 |
| [根目录配置文件检查.md](./根目录配置文件检查.md) | 根目录 package.json、tsconfig、vite、capacitor、tailwind、postcss、eslint、.env.example、.gitignore 等逐项检查与一致性 |
| [多余文件检查.md](./多余文件检查.md) | 未被引用或重复文件的检查结果与建议删除项 |
| [根目录配置与文档重复检查.md](./根目录配置与文档重复检查.md) | 根目录配置与文档重复情况检查（含 Android 文档合并建议）；ANDROID-总结 已删除，以 ANDROID_BUILD 为主入口 |
| [重复文件检查报告.md](./重复文件检查报告.md) | **针对整个 admin 仓库**（管理端 + jintu-attendance-app）的重复/同名文件分析，非仅本子项目 |

---

## 五、原生工程内（android/）

| 文件 | 说明 |
|------|------|
| [../android/README-SDK.md](../android/README-SDK.md) | 仅「安装 Android SDK」：Android Studio 与命令行两种方式，被 ANDROID_BUILD 引用 |

---

## 文档分类速查

- **我要跑起来 / 打安装包**：README → 本地运行；Android → ANDROID_BUILD、带签证打包-Android；iOS → IOS_BUILD  
- **我要商用 / 卖账号**：商用化路线图 → 售卖账号模式说明 → App更新与数据保留  
- **我要查兼容性 / 配置**：ANDROID-兼容性；根目录配置与文档重复检查  
- **从零建项目**：从0到落地步骤
