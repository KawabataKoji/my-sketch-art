import os

# 変換したいフォルダを指定（例：images と thumbs）
folders = ["images", "thumbs"]

for folder in folders:
    if not os.path.exists(folder):
        continue
    for filename in os.listdir(folder):
        old_path = os.path.join(folder, filename)

        # ファイルのみ対象
        if os.path.isfile(old_path):
            name, ext = os.path.splitext(filename)
            # 拡張子が大文字（例: .JPG, .PNG）なら小文字に変換
            if ext.upper() in [".JPG", ".JPEG", ".PNG", ".GIF"]:
                new_filename = name + ext.lower()
                new_path = os.path.join(folder, new_filename)

                # 名前が違う場合のみリネーム
                if old_path != new_path:
                    print(f"Renaming: {old_path} -> {new_path}")
                    os.rename(old_path, new_path)
