# Build a Full-Stack QR Code Generator in MERN with GraphQL & MongoDB (No External API Needed!)

Tags: #node #graphql #mongodb #qrcode

---

Have you ever found yourself in a situation where you needed to generate a QR code for a URL but didn't want to rely on external APIs? 
I have seen a few video thumbs on Youtube about it but never got to do it on my own.

So, as the wedding date approaches, I decided to build the possibility for guests to take pictures and upload them to the website. How do I advertise that? Write it down? Ask them to type it? 
No. Simply put a QR code on their tables.

Well... on this article I'll show you how I built a QR code service using my current's wedding website stack: Node.js, MongoDB, Apollo GraphQL, and Next.js.

You'll be able to see how easy it was to integrate the service on my existing architecture and if you wish to, you can also generate and store shareable QR codes without relying on external APIs. I won't be charging - for now!!! :-D Hahaha

Before we dive in, a few remarks:
- This project is 100% open source and available on [github.com/lfariabr/wedstack](https://github.com/lfariabr/wedstack)
- The website is live and the wedding date's scheduled for the end of this month on [weddingln.com](https://weddingln.com)
- The github issue for this feature is available on [github.com/lfariabr/wedstack/issues/12](https://github.com/lfariabr/wedstack/issues/12)

Let's get it rolling...

---

## 🎯 Project Goal

Create a service that transforms a URL into a QR code, stores it in MongoDB, and serves it to the frontend via GraphQL — **no external QR API required**.

---

## 🧱 Stack

- **Frontend**: Next.js 14+ with TypeScript, TailwindCSS, Apollo Client
- **Backend**: Node.js, Express, Apollo Server (GraphQL), MongoDB
- **Extras**: Base64 QR code images, Mongoose models, GraphQL schema/resolvers

---

## 🗂️ Feature Breakdown

- [x] Open issue for the QR code feature
- [x] Scaffold `QRCode` feature (based on `ftMemoryLane.md`)
- [x] Create Mongoose model: `QRCode.ts`
- [x] Add QRCode types to GraphQL schema
- [x] Implement `QRCodeService.ts`:
  - `generateQRCode`
  - `getQRCodeByUrl`
  - `getAllQRCodes`
- [x] Create GraphQL `qrCodeTypes`
- [x] Register in `schemas/typeDefs.ts`
- [x] Build GraphQL resolvers
- [x] Register in `resolvers/index.ts`
- [x] Build frontend UI: `app/qr-code/page.tsx`

---

## 🧠 Design Choices

### Why Base64 QR Codes?

- ✅ Embed directly in `<img src="..."/>`
- ✅ Easy to email or print
- ✅ No file uploads or S3 configs
- ✅ Secure and simple

---

## 🧪 Example Mutation

```graphql
mutation GenerateQRCode($input: QRCodeInput!) {{
  generateQRCode(input: $input) {{
    id
    url
    qrCodeData
    format
    size
    createdAt
    updatedAt
  }}
}}
```

**Variables**:

```json
{{
  "input": {{ 
    "url": "https://weddingln.com/memory-lane",
    "size": 300 
  }}
}}
```

---

## 📥 Example Query

```graphql
query GetQRCodeByUrl($url: String!) {{
  qrCode(url: $url) {{
    id
    url
    qrCodeData
    format
    size
    createdAt
    updatedAt
  }}
}}
```

**Variables**:

```json
{
  "url": "https://weddingln.com/memory-lane"
}
```

---

## 🖼️ Frontend Integration

```tsx
<img src="data:image/png;base64,{qrCodeData}" alt="Share Love QR Code" />
```

---

## 🚀 Outcome

We now have a reliable, customizable QR code service for our wedding project:

> Guests can scan a beautiful QR and get redirected to the love-sharing page!

This is part of a larger system I'm building called **Wedstack** — a modular MERN stack wedding toolkit.

---


---

## 🛠️ References & Motivation

Back when I started thinking about this QR code feature, I looked up online tools — you know, those “free” QR code generators. But very quickly I saw the catch:

- Paywalls to edit or track QR codes
- Hosted links that expire or redirect through their domains
- Ads and branding I couldn’t remove

And I thought: *this thing is going to be printed and handed out to people at our wedding tables. If that QR code dies, the experience dies with it.*

So instead of outsourcing something this important, I built it into our stack:

- 🧠 Fully integrated into our **MERN + GraphQL** architecture
- 🔒 Stored directly in our **MongoDB**
- 🖨️ Embedded via **Base64**, no file hosting required
- 💡 Powered by the `qrcode` npm package
- 🧪 Easily testable, reusable, and open source

I wanted reliability, simplicity, and a little bit of personal pride in knowing that even this small feature was **fully mine**.

This is how small product decisions reflect a larger engineering mindset.


## 🧠 Lessons Learned

- MERN + GraphQL allows for clean, modular APIs
- Using Base64 simplifies file handling
- Mongoose & Apollo Server = a power duo
- Planning ahead (issue tracking, service layers) pays off

## 💬 Questions?

Got feedback, ideas, or want to use this in your own project?  
Let’s connect — leave a comment or message
