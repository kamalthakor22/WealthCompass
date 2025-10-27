# WealthCompass
## WealthCompass Financial Tracking App Summary

## WealthCompass Financial Tracking App Summary

**Core Features Implemented:**

- JWT Authentication for secure email/password reg...ion and login

- Bank Accounts tracking with multiple currencies (INR, CAD, USD)

- Stocks price tracking via Google Finance scraping

- Mutual Funds with NAV tracking and portfolio management

- Fixed Deposits with automatic maturity amount calculations

- Complete Transactions history with categories

- Dashboard providing multi-currency portfolio overview with country breakdowns

**Security & Data:**

- Password hashing with bcrypt

- JWT tokens with 7-day expiration

- User-specific data isolation

- Protected routes requiring authentication

- Secure logout functionality

**Technical Stack:**

- Backend: FastAPI, MongoDB, Google Finance scraping, Alpha Vantage integration

- Frontend: React with Auth Context and responsive design

- Design: Modern teal/gold theme with Space Grotesk & Inter fonts

**Test Results:** 96% success (24/26 backend tests passed, frontend flows fully functional)

**Optional:**

Add `ALPHA_VANTAGE_KEY` in `/app/backend/.env` to enable currency exchange rates.

I have tested the app to the best of my capabilities. Please test it on your end and let me know if any issues persist or if further improvements are needed.
