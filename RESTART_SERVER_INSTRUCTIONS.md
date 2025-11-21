# 🔄 Server Restart Instructions

## ⚠️ CRITICAL: You MUST Restart the Server!

The error you're seeing is because the server is still running the OLD code.

---

## 🚀 How to Restart:

### Step 1: Stop the Current Server
In the terminal running your API server:
```
Press: Ctrl + C
```

You should see the server stop.

### Step 2: Start the Server Again
```bash
cd cs308/api
npm start
```

### Step 3: Verify It Started
You should see:
```
Server listening on port 3000
MongoDB connected successfully
⚠️  STRIPE_SECRET_KEY not found... (if you haven't added it yet)
```

---

## ✅ After Restart:

### What You Should See:

**When you click "Proceed to Payment", the terminal will show:**
```
=== CREATE CHECKOUT SESSION ===
User ID: 690df45a8ff28426e6dbc597
Request body: { delivery_address: '...' }
Cart found: Yes
Cart items: 1
Subtotal: 100000 Tax: 8000 Total: 108000
Creating Stripe session...
Stripe session created: cs_test_abc123...
POST /orders/create-checkout-session 200 ✅
```

**Instead of:**
```
POST /orders/create-checkout-session 500 ❌
```

---

## 🔍 If Still Getting Errors:

### Check These:

1. **Is the server actually restarted?**
   - Look for "Server listening on port 3000" message
   - Should be recent timestamp

2. **Is Stripe key added?**
   - Open `cs308/api/.env`
   - Should have: `STRIPE_SECRET_KEY=sk_test_...`

3. **Check the console logs:**
   - Terminal should show `=== CREATE CHECKOUT SESSION ===`
   - If not showing, server might not be restarted

---

## 🎯 Quick Checklist:

- [ ] Stop server (Ctrl+C)
- [ ] Verify it stopped (no more logs)
- [ ] Start server (`npm start`)
- [ ] See "Server listening on port 3000"
- [ ] Try checkout again
- [ ] Check for detailed logs

---

## 💡 Pro Tip:

Use `nodemon` for auto-restart during development:
```bash
cd cs308/api
npm run dev
```

This will automatically restart the server when you make code changes!

---

## ✅ Expected Result:

After restart:
- ✅ No more "Unexpected token '<'" error
- ✅ Detailed console logs appear
- ✅ Proper JSON error messages (if any)
- ✅ Redirects to Stripe checkout page

**The code is correct - just needs a server restart!** 🔄

