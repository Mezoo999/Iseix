# منصة Iseix للاستثمار

هذا المشروع هو منصة استثمارية مبنية باستخدام [Next.js](https://nextjs.org) و [Firebase](https://firebase.google.com).

## البدء

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## فهارس Firebase المطلوبة

هذا المشروع يتطلب بعض الفهارس المركبة في Firebase Firestore لتشغيله بشكل صحيح. يمكنك العثور على قائمة بالفهارس المطلوبة في ملف [src/firebase/indexes.md](src/firebase/indexes.md).

### كيفية إنشاء الفهارس

1. انقر على الروابط المذكورة في ملف [src/firebase/indexes.md](src/firebase/indexes.md) لإنشاء الفهارس المطلوبة.
2. قم بتسجيل الدخول إلى حساب Firebase الخاص بك.
3. انقر على زر "إنشاء الفهرس" (Create Index).
4. انتظر حتى يتم إنشاء الفهرس (قد يستغرق هذا بضع دقائق).

## النشر على Vercel

أسهل طريقة لنشر تطبيق Next.js الخاص بك هي استخدام [منصة Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) من مبتكري Next.js.

راجع [وثائق نشر Next.js](https://nextjs.org/docs/app/building-your-application/deploying) لمزيد من التفاصيل.
