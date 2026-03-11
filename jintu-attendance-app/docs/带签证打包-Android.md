# Android 带签证打包（Release 签名）

用于打出**已签名的 Release APK**，便于分发或上架应用市场。

## 项目内签证相关文件（记录用）

| 路径 | 说明 |
|------|------|
| `android/keystore.properties` | 签名配置（密码、alias、storeFile），由 example 复制后填写，**勿提交** |
| `android/keystore.properties.example` | 配置模板，可提交 |
| `android/jintu-release-key.jks` | 密钥库（keytool 生成），**勿提交** |
| `android/app/build.gradle` | 读取 `rootProject.file("keystore.properties")`，存在则配置 `signingConfigs.release` |
| `android/.gitignore` | 已忽略 `keystore.properties`、`*.jks`、`*.keystore` |

---

## 一、首次配置（只需做一次）

### 1. 生成密钥库（若还没有）

在项目根目录（`jintu-attendance-app`）下执行：

```bash
cd android
keytool -genkey -v -keystore jintu-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias jintu
```

按提示输入密钥库密码、姓名、组织等，**请牢记密码和 alias（上面用的 `jintu`）**。

### 2. 配置签名信息

```bash
cd android
cp keystore.properties.example keystore.properties
```

编辑 `keystore.properties`，填入真实值：

```properties
storeFile=../jintu-release-key.jks
storePassword=你的密钥库密码
keyAlias=jintu
keyPassword=你的密钥密码
```

- `storeFile`：相对于 `android/app/` 的路径。密钥库在 `android/` 下则填 `../jintu-release-key.jks`。
- 勿将 `keystore.properties` 和 `*.jks` 提交到 Git（已加入 .gitignore）。

## 二、打包命令

在 **jintu-attendance-app** 根目录执行：

```bash
npm run apk:release
```

成功后，**已签名的 Release APK** 位置：

- `android/app/build/outputs/apk/release/app-release.apk`

该 APK 可直接用于安装、分发或上传应用市场。

## 三、未配置签名时

若未创建 `keystore.properties`，执行 `npm run apk:release` 会打出**未签名的** `app-release-unsigned.apk`，部分设备无法安装。此时可：

- **仅需可安装包**：使用 `npm run apk:debug` 得到已签名的 debug 包（`app-debug.apk`）。
- **需要正式签名包**：按上文完成「一、首次配置」后再执行 `npm run apk:release`。

## 四、常用命令

| 命令 | 产物 | 说明 |
|------|------|------|
| `npm run apk:debug` | app-debug.apk（debug 签名） | 可直接安装，适合测试分发 |
| `npm run apk:release` | app-release.apk（release 签名） | 需先配置 keystore，适合正式/上架 |

## 五、常见报错与处理

| 报错 | 处理 |
|------|------|
| `keystore password was incorrect` | `keystore.properties` 中 `storePassword`、`keyPassword` 与创建 jks 时设置的密码不一致，修改为正确密码后重试。 |
| `Could not get unknown property 'keystoreProperties'` | 已修复：`build.gradle` 中 `keystoreProperties` 需在脚本级定义（在 `if (hasReleaseSigning)` 外），以便在 `signingConfigs.release` 内可用。 |
| 未找到 keystore.properties | 按「一、首次配置」执行：生成 jks、复制 example 为 `keystore.properties` 并填写。未配置时 `apk:release` 打出的是未签名包。 |
