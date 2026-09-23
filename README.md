# Kewi — رفع صور التقييمات

صفحة ويب محمية بكلمة سر: تختار منتج ← ترفع صورة أو أكتر ← كل صورة تتضاف كـ entry في الـ metaobject `product_review_images` (الحقلين `review_image` و `product`)، فتظهر علطول في صفحة المنتج وفي بوب-أب التقييمات.

## 1) اعمل App في شوبيفاي
Shopify Admin ← **Settings ← Apps ← Develop apps** (أو من Dev Dashboard) ← أنشئ app جديد، وادّيله الصلاحيات دي (Admin API scopes):

- `read_products`
- `read_files`, `write_files`
- `read_metaobjects`, `write_metaobjects`
- `read_metaobject_definitions`

بعد ما تعمل Install للـ app على المتجر خُد:
- **Client ID** و **Client secret** ← في `SHOPIFY_CLIENT_ID` و `SHOPIFY_CLIENT_SECRET`
- أو لو الـ app بيديك Admin API access token (`shpat_...`) ← حطه في `SHOPIFY_ADMIN_TOKEN` بدلهم.

## 2) ارفعها على Vercel
1. ارفع الفولدر ده على repo جديد في GitHub (مش repo الثيم).
2. في vercel.com ← **Add New Project** ← اختار الـ repo (مش محتاج Build settings).
3. في **Settings ← Environment Variables** ضيف القيم اللي في `.env.example`:
   - `SHOPIFY_STORE` = `yourstore.myshopify.com`
   - `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` (أو `SHOPIFY_ADMIN_TOKEN`)
   - `UPLOAD_PASSWORD` = كلمة سر قوية
4. Redeploy وافتح اللينك.

## ملاحظات
- الصورة بتترفع من المتصفح لشوبيفاي مباشرة (staged upload)، فمفيش حد لحجم الصورة من Vercel.
- التوكن وكلمة السر موجودين على السيرفر بس، مش في الصفحة.
- المسح من "آخر الصور المضافة" بيمسح الـ entry من التقييمات؛ الصورة نفسها بتفضل في Settings ← Files.
- لو الـ metaobject definition متفعّل فيه **Active/Draft**، الـ entries بتتعمل Active تلقائياً.

## تشغيل محلي
```
npm i -g vercel
vercel dev
```
(حط القيم في ملف `.env` جنب المشروع.)
