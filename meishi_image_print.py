from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

# 日本語フォント
pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))

# -----------------------------
# 設定
# -----------------------------
url = "https://kawabatakoji.github.io/my-sketch-art/"
output_pdf = "business_card_with_image.pdf"
image_path = "images/yubae_miti.jpg"

# A4サイズ
page_w, page_h = A4

# 名刺サイズ
card_w = 91 * mm
card_h = 55 * mm

# 位置調整（以前のご希望）
margin_x = 12 * mm   # 左余白（右に7mm移動後を想定）
margin_y = 8 * mm    # 上に2mm移動後を想定
gap_x = 2 * mm
gap_y = 2 * mm

# 画像サイズ（縦15mm）
img_h = 15 * mm
img_w = 20 * mm   # 細めの縦画像として配置

# -----------------------------
# QRコード準備
# -----------------------------
qr_code = qr.QrCodeWidget(url)
bounds = qr_code.getBounds()
qr_w = bounds[2] - bounds[0]
qr_h = bounds[3] - bounds[1]
qr_size = 18 * mm

qr_draw = Drawing(
    qr_size, qr_size,
    transform=[qr_size / qr_w, 0, 0, qr_size / qr_h, 0, 0]
)
qr_draw.add(qr_code)

# -----------------------------
# 文字スタイル
# -----------------------------
# タイトル（中央）
title_style = ParagraphStyle(
    "title",
    fontName="HeiseiMin-W3",
    fontSize=12,
    leading=12,
    alignment=1
)

# 名前（中央）
name_style = ParagraphStyle(
    "name",
    fontName="HeiseiMin-W3",
    fontSize=18,
    leading=16,
    alignment=1
)

# 説明（中央）
body_style = ParagraphStyle(
    "body",
    fontName="HeiseiMin-W3",
    fontSize=8,
    leading=10,
    alignment=1
)

# 下の情報（左詰め ←今回の修正）
info_style = ParagraphStyle(
    "info",
    fontName="HeiseiMin-W3",
    fontSize=8,
    leading=10,
    alignment=0
)
# -----------------------------
# PDF作成
# -----------------------------
c = canvas.Canvas(output_pdf, pagesize=A4)

# 画像読み込み
img = ImageReader(image_path)

# 10面（2列×5行）
for row in range(5):
    for col in range(2):
        x = margin_x + col * (card_w + gap_x)
        y = page_h - margin_y - (row + 1) * card_h - row * gap_y

        # 枠線（確認用）
        # c.setStrokeColorRGB(0.85, 0.85, 0.85)
        # c.rect(x, y, card_w, card_h)

        # タイトル
        p = Paragraph("バタジーのスケッチ＆AIアプリ", title_style)
        w, h = p.wrap(card_w - 10, 20)
        p.drawOn(c, x + 5, y + card_h - 15 - h)

        # 名前
        p = Paragraph("川端 浩二", name_style)
        w, h2 = p.wrap(card_w - 10, 20)
        p.drawOn(c, x + 5, y + card_h - 30 - h2 - 9*mm)

        # 説明
        p = Paragraph("水彩画 × AIアプリ制作", body_style)
        w, h3 = p.wrap(card_w - 10, 20)
        p.drawOn(c, x + 5, y + card_h - 45 - h3 - 13*mm)

        # メール 携帯番号
        p = Paragraph("mail:mikan579@me.com", info_style)
        w, h_mail = p.wrap(card_w - 10, 20)
        p.drawOn(c, x + 20, y + 25)

        # 電話番号（例：書き換えてください）
        p = Paragraph("携帯番号：090-8833-4504", info_style)
        w, h_tel = p.wrap(card_w - 10, 20)
        p.drawOn(c, x + 20, y + 16)

        # URL
        p = Paragraph(url, info_style)
        w, h4 = p.wrap(card_w - 10, 20)
        p.drawOn(c, x + 20, y + 7)

        # QRコード（右下）
        qr_draw.drawOn(c, x + card_w - qr_size - 5, y + 5)

        # 画像（右側の空きスペースに縦配置）
        # QRの上あたりに置く
        img_x = x + card_w - img_w - 5
        img_y = y + 26 * mm

        c.drawImage(
            img,
            img_x,
            img_y,
            width=img_w,
            height=img_h,
            preserveAspectRatio=True,
            mask="auto"
        )

c.save()
print("PDFを作成しました:", output_pdf)