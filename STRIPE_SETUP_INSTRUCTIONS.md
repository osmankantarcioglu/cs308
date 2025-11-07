# 🔑 Stripe Setup Instructions

## ⚠️ Server Error Fixed - Stripe Key Required

The error you're seeing:
```
Error: Neither apiKey nor config.authenticator provided
```

This means the Stripe API key is missing from your `.env` file.

---

## 🚀 Quick Fix (2 Steps):

### Step 1: Add Stripe Key to `.env`

Open the file: `cs308/api/.env`

Add these lines:
```env
STRIPE_SECRET_KEY=sk_test_51QRabc123_YOUR_KEY_HERE
CLIENT_URL=http://localhost:5173
```

**For now, you can use this test key to get started:**
```env
STRIPE_SECRET_KEY=sk_test_51Placeholder1234567890
CLIENT_URL=http://localhost:5173
```

### Step 2: Restart Server
```bash
cd cs308/api
npm start
```

The server should now start without errors!

---

## 🎯 To Get Real Stripe Keys (Optional - for actual payments):

### 1. **Create Stripe Account** (Free)
- Go to: https://stripe.com
- Click "Sign up" (it's free!)
- Complete registration

### 2. **Get Test API Keys**
- Login to Stripe Dashboard
- Go to: **Developers** → **API keys**
- Make sure you're in **Test mode** (toggle at top)
- Copy your keys:
  - **Secret key** (starts with `sk_test_`)
  - **Publishable key** (starts with `pk_test_`)

### 3. **Add to `.env`**
```env
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
CLIENT_URL=http://localhost:5173
```

---

## 🧪 Test Payment Flow:

Once Stripe is configured, use these test cards:

### ✅ Successful Payment:
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345
```

### ❌ Failed Payment:
```
Card Number: 4000 0000 0000 0002
```

---

## 📝 What Happens After Setup:

1. ✅ Server starts without errors
2. ✅ Checkout button works
3. ✅ Redirects to Stripe payment page
4. ✅ After payment, order is created
5. ✅ Stock is decreased automatically
6. ✅ Order appears in profile page

---

## 🔧 Alternative: Skip Stripe for Now

If you want to test without Stripe, you can create a mock checkout endpoint:

1. The server will start with a warning (not an error)
2. Checkout will show an error message
3. All other features (wishlist, cart, profile) work fine
4. Add Stripe key later when ready

---

## ✅ Quick Summary:

**To fix the error RIGHT NOW:**

1. Open: `cs308/api/.env`
2. Add line: `STRIPE_SECRET_KEY=sk_test_placeholder`
3. Add line: `CLIENT_URL=http://localhost:5173`
4. Save file
5. Restart server: `npm start`

**Server will start successfully!** ✅

Then get real Stripe keys from https://stripe.com when you want to test actual payments.

