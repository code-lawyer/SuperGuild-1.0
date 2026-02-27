# 3D 资产转 NFT 指引 (2026 版)

本项目（Super Guild）的特权权益与 3D 展示高度依赖于标准的 **GLB** 格式 NFT。以下是手把手将你的 3D 建模转化为链上特权资产的流程。

---

## 第一步：资产准备 (3D Modeling & Export)

### 1. 建模规范

* **工具**：推荐使用 Blender。
* **导出格式**：必须为 **`.glb`**。
* **限制建议**：
  * **多边形**：< 10,000 面 (保证网页秒开)。
  * **贴图**：使用 PBR 材质，贴图建议 1024x1024。
  * **动画**：支持骨骼动画，导出时勾选 "Animation"。

---

## 第二步：选择铸造平台

推荐使用 **[Thirdweb](https://thirdweb.com/)**，因为它对开发者最友好，且生成的合约标准。

### 为什么选择 Thirdweb？

* **多链支持**：支持 Arbitrum Sepolia (测试) 和 Arbitrum One (主网)。
* **无代码仪表盘**：图形化上传 3D 模型。
* **IPFS 自动托管**：上传文件时自动保存到去中心化存储。

---

## 第三步：手把手操作流程

### 1. 部署智能合约

1. 登录 [Thirdweb Dashboard](https://thirdweb.com/dashboard)。
2. 点击 **"Deploy New Contract"**。
3. 搜索并选择 **"Edition Drop" (ERC-1155)** —— *最适合发行有多份副本的特权凭证*。
4. 填写合约信息（名称：Super Guild Privileges，符号：SGP）。
5. 选择网络：**Arbitrum Sepolia**。
6. 点击 **"Deploy Now"**。

### 2. 上传 3D 勋章

1. 进入合约管理页面的 **"NFTs"** 标签。
2. 点击 **"+ Single Upload"**。
3. **关键点**：在 "Media" 框中直接拖入你的 **`.glb`** 文件。
4. 填写名称（如：提灯人枯盏）和描述。
5. 点击 **"Mint NFT"**。

### 3. 设置领取条件 (Claim Conditions)

1. 在刚才铸造的 NFT 页面，点击 **"Claim Conditions"**。
2. 点击 **"Add Phase"**。
3. 设置价格（0 ETH）和谁可以领取（或由你手动空投单）。
4. 保存设置。

---

## 第四步：同步给 AI 助理 "Rhythm (韵)"

当你完成铸造后，请将以下数据反馈给 AI 助理，以便我完成治理权限绑定：

1. **合约地址 (Contract Address)**：例如 `0x123...abc`。
2. **网络 (Network)**：例如 `Arbitrum Sepolia`。
3. **Token ID**：
    * ID 0 -> 初火
    * ID 1 -> 提灯人枯盏
    * ID 2 -> 拓世者纪念章

---

## 避坑指南

* **检查纹理**：在导出前，在 Blender 的物体模式下检查 `File -> External Data -> Pack All Into .blend`，确保纹理嵌入，否则导出的 GLB 可能没有颜色。
* **测试预览**：上传前可以在 [glTF Viewer](https://gltf-viewer.donmccurdy.com/) 预览模型效果，如果这里显示正常，网页上就显示正常。
