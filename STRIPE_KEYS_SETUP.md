# 🔑 Stripe API Keys Setup Guide

## Current Issue
The payment system is showing **401 Unauthorized** errors because placeholder Stripe API keys are being used instead of real test keys.

## ✅ Quick Fix - Get Real Stripe Test Keys

### Step 1: Create Free Stripe Account
1. Go to https://stripe.com
2. Click "Start now" or "Sign up"
3. Create your account (it's free!)
4. Verify your email

### Step 2: Get Your Test API Keys
1. **Login to Stripe Dashboard**
2. **Make sure you're in "Test mode"** (toggle in top-left should say "Test data")
3. **Go to Developers → API Keys**
4. **Copy your keys:**
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - click "Reveal" to see it

### Step 3: Update Your .env Files

**Backend (.env file):**
```bash
# Replace these with your actual Stripe test keys
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
```

**Frontend (.env file):**
```bash
# Replace with your actual Stripe publishable key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
```

### Step 4: Restart the Backend
```bash
# Kill the current backend process
# Then restart it to pick up new keys
cd backend && go run main.go
```

---

## 🧪 Test Keys vs Live Keys

| Type | Test Keys | Live Keys |
|------|-----------|-----------|
| **Secret** | `sk_test_...` | `sk_live_...` |
| **Publishable** | `pk_test_...` | `pk_live_...` |
| **Safety** | ✅ Safe for development | ⚠️ Real money |
| **Cards** | Test cards only | Real cards |

---

## 💳 Test Credit Cards (Once keys are set up)

| Purpose | Card Number | Any CVC | Any future date |
|---------|-------------|---------|-----------------|
| **Success** | `4242 4242 4242 4242` | `123` | `12/25` |
| **Declined** | `4000 0000 0000 0002` | `123` | `12/25` |
| **Insufficient Funds** | `4000 0000 0000 9995` | `123` | `12/25` |

---

## 🚨 Important Notes

- **Test mode is safe** - No real money is processed
- **Never commit real keys** - Add .env to .gitignore 
- **Test keys are free** - No charges for using test API
- **Multiple developers** - Each can use the same test keys

---

## 🔍 How to Verify It's Working

After updating the keys:

1. **Check backend logs** - Should see "Stripe initialized successfully!"
2. **Try payment flow** - No more 401 errors
3. **Test with test card** - `4242 4242 4242 4242`
4. **Check Stripe dashboard** - See test payments in Stripe

---

## 🛠️ Troubleshooting

**"Invalid API Key" errors:**
- Double-check you copied the full key
- Make sure there are no extra spaces
- Verify you're using test keys (start with `sk_test_` and `pk_test_`)
- Restart the backend after changing .env

**"No such customer" errors:**
- This is normal with test keys
- Test mode has separate data from live mode

**Still getting 401:**
- Clear browser cache
- Restart both frontend and backend
- Double-check both .env files are updated

---

## 🎯 Next Steps

Once you have real Stripe test keys:

1. **Update the .env files** with your actual keys
2. **Restart the backend** 
3. **Test the payment flow** - should work perfectly!
4. **See payments in Stripe dashboard** - real test data

The payment integration is 100% complete - just needs real Stripe keys to activate! 🚀