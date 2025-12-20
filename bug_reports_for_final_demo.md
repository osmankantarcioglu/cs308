# Bug Reports for Final Demo

## Bug Report #006

### One-Line Summary
Discount badges do not appear on product pages after applying discounts from Sales Manager Dashboard, despite discount being successfully created and prices being updated.

### Product Release
Version 1.0.0 - Production Release

### Operating Environment
- OS: Windows 10 (Build 26200)
- Node.js Version: v18.x or higher
- Database: MongoDB
- Framework: Express.js (API), React.js (Client)
- Browser: Modern browsers (Chrome, Firefox, Edge)

### System Resources
- Backend API: Running on port 3000
- Frontend Client: Running on Vite dev server
- Database: MongoDB instance with products and discounts collections
- API Endpoint: `GET /products` with discount population

### Problem History
- **Initial State**: Discount creation endpoint successfully created discount records and updated product prices
- **Issue Discovered**: After creating a discount for a product (e.g., MacBook Pro), the discount badge did not appear on the products page (`/products`)
- **Root Cause**: The `/products` API endpoint was not populating active discount information when fetching products. The discount data existed in the database but was not being included in the API response
- **Impact**: Users could not see discount information on product listings, leading to confusion about pricing and missed sales opportunities

### Expected Behavior
- When a discount is active for a product, the discount badge should appear on the product card
- Badge should display the discount percentage (e.g., "25% OFF")
- Badge should be positioned in the top-left corner of the product card to avoid conflict with wishlist icon
- Discount information should be fetched and included in the product API response
- Original price should be shown with strikethrough, and discounted price should be displayed

### Observed Behavior
- Discounts were successfully created in the database
- Product prices were updated correctly in the database
- Discount badges did not appear on the products page
- Product cards showed only the current price without discount indication
- No discount information was present in the API response for products
- Admin dashboard also did not show discount badges

### Resolution
- Updated `GET /products` endpoint in `api/routes/products.js` to fetch active discounts for products
- Implemented discount mapping logic to match products with their active discounts
- Added `active_discount` object to product response containing `discount_rate` and `original_price`
- Fixed ObjectId comparison issues by converting both product IDs and discount product IDs to strings for reliable comparison
- Updated `ProductsPage.jsx` to conditionally render discount badges based on `active_discount` data
- Updated `FeaturedProducts.jsx` and `AdminPage.jsx` to display discount badges
- Ensured discount badges are positioned correctly relative to wishlist and "Out of Stock" badges

---

## Bug Report #007

### One-Line Summary
Invoice PDFs cannot be accessed when clicking "Print" button due to "No token provided" authentication error, preventing users from printing invoices.

### Product Release
Version 1.0.0 - Production Release

### Operating Environment
- OS: Windows 10 (Build 26200)
- Node.js Version: v18.x or higher
- Database: MongoDB
- Framework: Express.js (API), React.js (Client)
- Browser: Modern browsers (Chrome, Firefox, Edge)

### System Resources
- Backend API: Running on port 3000
- Frontend Client: Running on Vite dev server
- API Endpoint: `GET /orders/:id/invoice/pdf` (requires authentication)
- PDF Generation: Using PDFKit library

### Problem History
- **Initial State**: Invoice PDF generation and storage was working correctly
- **Issue Discovered**: Clicking the "Print" button on Sales Manager Dashboard resulted in a 401 Unauthorized error with message "No token provided. Please provide a valid Bearer token."
- **Root Cause**: The print functionality was using `window.open()` to directly navigate to the PDF URL, which does not include authentication headers. The backend endpoint requires a Bearer token in the Authorization header
- **Impact**: Sales managers and other authorized users could not print or view invoice PDFs, affecting business operations and customer service

### Expected Behavior
- Clicking "Print" button should open the invoice PDF in a new window
- PDF should be accessible with proper authentication
- Print dialog should appear automatically
- Authentication token should be included in the request
- Users with appropriate permissions (admin, sales manager, product manager) should be able to access invoices

### Observed Behavior
- Clicking "Print" button opened a new window/tab
- Browser console showed 401 Unauthorized error
- Error message: `{"success":false,"error":"No token provided. Please provide a valid Bearer token."}`
- PDF was not displayed
- Network tab showed the request was made without Authorization header
- Direct URL navigation bypassed authentication mechanism

### Resolution
- Updated `handlePrintInvoice` function in `SalesManagerDashboard.jsx` to use `authenticatedFetch` instead of `window.open()`
- Implemented blob-based PDF retrieval: fetch PDF as blob with authentication token
- Created blob URL from response and opened it in a new window
- Added automatic print dialog trigger after PDF loads
- Ensured proper error handling for authentication failures
- Maintained backward compatibility with existing invoice viewing functionality

---

## Bug Report #008

### One-Line Summary
Refund request modal opens a blank white page instead of displaying the refund request form, preventing customers from submitting refund requests.

### Product Release
Version 1.0.0 - Production Release

### Operating Environment
- OS: Windows 10 (Build 26200)
- Node.js Version: v18.x or higher
- Database: MongoDB
- Framework: Express.js (API), React.js (Client)
- Browser: Modern browsers (Chrome, Firefox, Edge)

### System Resources
- Backend API: Running on port 3000
- Frontend Client: Running on Vite dev server
- API Endpoint: `POST /orders/:id/refund`
- Component: `ProfilePage.jsx` refund modal

### Problem History
- **Initial State**: Refund request functionality was implemented with a modal component
- **Issue Discovered**: Clicking "Request Refund" button on a delivered order opened a blank white page instead of the refund modal
- **Root Cause**: Missing or incorrect state initialization for refund-related data, potential issues with `selectedOrder.items` being undefined or empty, or errors in the modal rendering logic
- **Impact**: Customers could not request refunds for delivered products, leading to customer dissatisfaction and support ticket increases

### Expected Behavior
- Clicking "Request Refund" should open a modal overlay with refund request form
- Modal should display list of products from the order
- Customers should be able to select which products to refund
- Modal should show remaining days for refund eligibility (30-day window)
- Form should include reason field for refund request
- Submit button should be disabled until at least one product is selected and reason is provided

### Observed Behavior
- Clicking "Request Refund" button triggered modal state change
- Modal overlay appeared but content was blank/white
- No product list was displayed
- No form fields were visible
- Console may have shown errors related to undefined properties
- Modal could not be closed properly
- Page navigation was disrupted

### Resolution
- Fixed state initialization for `selectedOrder`, `selectedProducts`, and `refundReason`
- Added null checks and default values for `selectedOrder.items` before mapping
- Ensured proper conditional rendering in modal JSX
- Added error boundaries and fallback UI for edge cases
- Fixed product ID extraction logic to handle both ObjectId objects and strings
- Implemented proper modal close functionality
- Added loading states and error handling for refund submission

---

## Bug Report #009

### One-Line Summary
Customers can submit multiple refund requests for the same product within an order, causing duplicate refund entries and potential financial discrepancies.

### Product Release
Version 1.0.0 - Production Release

### Operating Environment
- OS: Windows 10 (Build 26200)
- Node.js Version: v18.x or higher
- Database: MongoDB
- Framework: Express.js (API), React.js (Client)
- Browser: Modern browsers (Chrome, Firefox, Edge)

### System Resources
- Backend API: Running on port 3000
- Frontend Client: Running on Vite dev server
- API Endpoint: `POST /orders/:id/refund`
- Database: Refund model with order_id and product_id fields

### Problem History
- **Initial State**: Refund request endpoint allowed creating refund requests without checking for duplicates
- **Issue Discovered**: Customers could click "Request Refund" multiple times for the same product, creating duplicate refund entries in the database
- **Root Cause**: No validation was in place to check if a refund request already existed for a specific product within an order. The frontend also did not prevent multiple submissions
- **Impact**: Multiple refund requests for the same product led to:
  - Confusion in sales manager dashboard
  - Potential double refunds if not caught manually
  - Database clutter with duplicate entries
  - Inconsistent refund status tracking

### Expected Behavior
- System should prevent duplicate refund requests for the same product within an order
- If a refund request already exists (pending or approved), customer should be informed
- Frontend should disable "Request Refund" button or show appropriate message if refund already in progress
- Backend should validate and reject duplicate refund requests with clear error message
- Only one refund request per product per order should be allowed

### Observed Behavior
- Customer could click "Request Refund" multiple times
- Multiple refund entries were created in database for the same product
- Sales manager dashboard showed duplicate refund requests
- No warning or error message was displayed to customer
- Refund status became confusing with multiple entries
- Potential for processing the same refund multiple times

### Resolution
- **Backend Fix**: Added validation in `POST /orders/:id/refund` endpoint to check for existing refund requests
- Query checks for existing refunds with same `order_id` and `product_id` with status `pending` or `approved`
- Returns `ValidationError` if duplicate refund request is attempted
- **Frontend Fix**: Added check in `openRefundModal` function to verify if all products already have refunds
- Disabled product checkboxes in modal if refund already exists for that product
- Changed "Request Refund" button to "Refund Request In Progress" if any refund is pending
- Added visual indicators (disabled state, warning messages) for products with existing refunds
- Improved user feedback with clear messaging about refund status

---

## Bug Report #010

### One-Line Summary
Product stock quantity can become negative or incorrect when multiple orders are placed simultaneously for the same product, causing inventory management issues.

### Product Release
Version 1.0.0 - Production Release

### Operating Environment
- OS: Windows 10 (Build 26200)
- Node.js Version: v18.x or higher
- Database: MongoDB
- Framework: Express.js (API), React.js (Client)
- Database: MongoDB with products collection

### System Resources
- Backend API: Running on port 3000
- Database: MongoDB with atomic operations support
- API Endpoint: `POST /orders` (order creation with stock update)
- Product Model: `Product.updateStock()` method

### Problem History
- **Initial State**: Stock updates were performed using `findById`, modify, and `save()` operations
- **Issue Discovered**: When multiple customers placed orders for the same product simultaneously, stock quantities could become negative or incorrect
- **Root Cause**: Race condition in stock update logic. The process was:
  1. Fetch product with current stock
  2. Check if stock is sufficient
  3. Decrease stock and save
  This non-atomic sequence allowed multiple requests to read the same stock value before any of them updated it, leading to overselling
- **Impact**: 
  - Products could be sold beyond available inventory
  - Stock quantities showed negative values
  - Orders were created for out-of-stock products
  - Inventory management became unreliable
  - Customer orders could not be fulfilled

### Expected Behavior
- Stock updates should be atomic and thread-safe
- Multiple concurrent orders should correctly decrease stock
- Stock should never become negative
- If stock is insufficient, order should be rejected with clear error message
- Stock updates should be consistent and accurate under high concurrency

### Observed Behavior
- Multiple simultaneous orders for the same product
- Stock quantity became negative (e.g., -5 units)
- Orders were created even when stock was insufficient
- Database showed inconsistent stock values
- Race conditions occurred during peak traffic
- Example: Product with 10 units in stock, 3 customers order 5 units each simultaneously, resulting in -5 stock instead of rejecting 2 orders

### Resolution
- **Updated Product Model**: Modified `Product.updateStock()` and `Product.addStock()` methods to use MongoDB atomic operations
- Replaced `findById`, modify, `save()` pattern with `findByIdAndUpdate()` using `$inc` operator
- `$inc` operator ensures atomic increment/decrement operations at database level
- **Updated Order Creation**: Modified order creation endpoint to use atomic stock update
- Added proper error handling for insufficient stock scenarios
- Implemented transaction-like behavior for stock updates
- Added validation to prevent negative stock values at database level
- Ensured stock updates are consistent even under high concurrency
- All stock operations now use atomic MongoDB operations to prevent race conditions

---

## Summary

All five bugs have been resolved in the current codebase:
1. **Bug #006**: Discount badges now appear correctly on product pages after discount creation
2. **Bug #007**: Invoice PDF printing now works with proper authentication using blob-based retrieval
3. **Bug #008**: Refund request modal now displays correctly with proper state management and error handling
4. **Bug #009**: Duplicate refund requests are now prevented both on frontend and backend
5. **Bug #010**: Stock management now uses atomic operations to prevent race conditions and negative stock

All fixes maintain backward compatibility, follow best practices for error handling, and improve system reliability and user experience.

