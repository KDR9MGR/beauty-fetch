<<<<<<< HEAD
✅ OVERVIEW CHECKLIST
🔧 Website Development (Customer-Facing)
Location-Based Store Selection


User Account System (Sign-up/Login/Profile)


Store Discovery + Search + Filter


Product Listing with Sort & Filter


Cart & Checkout Flow


Delivery Fee Calculation (via Google API)


Payment Gateway Integration


Real-Time Order Tracking


Tipping & Feedback System


🛍️ Merchant Portal
Merchant Dashboard (Login/Profile)


Store Hours & Product Availability Management


Promotions + Inventory Sync


Admin Approval Workflow


Internal Messaging with Admin






🔄 Admin Dashboard
Merchant Moderation Panel


Customer & Driver Management


Order Logs + System Monitoring


Configurable App Parameters



📋 DETAILED STEP-BY-STEP CHECKLIST

🌍 Location-Based Store Selection
Integrate Google Maps API


Prompt user for location on website entry


Fetch nearby stores using coordinates


Display list/grid of stores based on radius



👤 User Account System
Setup Supabase Auth for sign-up/login


Build registration + login forms


Create profile management UI


Secure routes with authentication checks











🔎 Store Discovery + Search + Filter
Backend: Store schema (name, tags, hours, rating)


Frontend search input with debounced search


Filters for category, rating, open status
Display store cards in grid view



🛒 Product Listing & Sorting
Fetch store-specific products from Supabase


Build product cards with image, title, price


Add sorting (price, popularity)


Add filters (category, availability)



🛍️ Cart & Checkout Flow
Build cart state & context


Create checkout summary page


Validate address & store selection


Allow tip pre-selection




🚚 Delivery Fee Calculation
Setup Google Maps Distance Matrix API


Input: Store → User location


Calculate fee based on distance rule


Display fee on cart & checkout




💳 Payment Gateway Integration
Choose provider (e.g., Stripe, Razorpay)


Build secure payment modal


Handle success/failure callbacks


Store transaction history in Supabase



📦 Real-Time Order Tracking
Create order tracking page


Integrate location updates from driver app


Use Supabase Realtime or Agent for live sync


Display ETA + driver info








💬 Feedback & Tipping
Show tipping modal after delivery


Store tips securely linked to driver ID


Enable review and rating submission


Update driver/store average ratings



🧑‍💼 Merchant Dashboard
Secure Supabase Auth for merchant roles


Store editing: hours, availability, promos


Product management UI with status sync


Submit changes for admin approval


Status notifications via inbox



🔒 Admin Approval Workflow
Track submitted updates in pending state


Create Admin dashboard view for review


Approve/Reject and sync data live









💬 Internal Messaging System
Setup inbox model in Supabase


Merchant ↔ Admin chat interface


Notification on message received



🧑‍💻 Admin Dashboard
Create tabs for: Users, Drivers, Merchants, Orders


Enable role-based access control


Provide full moderation UI (CRUD)


Show real-time analytics (order count, revenue)





















🧠 Process Flow using lovable.ai + Cursor + Supabase
Design in lovable.ai


Use it to generate initial components and flows


Export into your frontend code (React/Vue etc.)


Backend with Supabase


Use Supabase for Auth, DB, Realtime, and Edge Functions


Set up database schema: Users, Stores, Products, Orders, Tips, Messages, etc.


Workflow Automation with Agent


Use Agent to:


Trigger order assignment workflows


Calculate delivery fees


Approve merchant changes


Notify users/drivers/merchants


Coding Environment: Cursor


Use Cursor IDE for seamless coding experience


Integrate with lovable’s UI outputs


Use Supabase client libraries for backend comms



=======
#1. PRODUCTS

1.1 Store Listings on Product Pages: Under each product, where it currently says "stores," it should show the number of stores carrying
that product.

1.2 Add a dropdown menu that displays the full list of those stores when clicked.

1.3 Pricing Display: Product pricing should vary because different stores may have different prices for the same item.

1.4 Product Information Editing: When clicking "Edit Product," the product-specific information should dynamically change based on
the selected store (e.g., store-specific price & cost).

1.5 Category Dropdown for Products: Include a dropdown for product categories since some products fall into multiple categories.
Product Listing Format: Products should appear in alphabetical order.
Include a search bar for easier navigation.

#2. CATEGORIES

2.1 Subcategory Dropdowns: Categories should support dropdowns for subcategories.

2.2 Editing View: When editing a category, admin should be able to view all products within that category and any
subcategories.
This functionality should also apply when editing subcategories.

#3. ORDERS

3.1 Order Tabs: Add tabs for Canceled Orders,Archived Orders,Fraud Risk (if possible)
Store-Based Filtering: Orders should be able to be filterable by stores as well.
Cost Breakdown: Add a “Cost Per Order” view showing: How much was spent
What the customer paidProfit margins

#4. USERS

4.1 Admin Access to User Info: Under user details, admins should be able to:
Block usersSee their full order history
View all personal info provided during registration

#5. STORES 

5.1 Visibility: Store hours should be visible in both edit mode and public view.

5.2 Owner & Manager Details: Add a tab for store owner & store managers information (viewable in edit mode).
5.3 Commission Info: Create a section to display the commission Beauty Fetch earns mode). per store (visible in edit & view

Order Count: Add visibility for the number of orders per store (outside of edit mode).

#6. MESSAGES

Messages should be able to be  organized by store as well.

#7. APPROVALS

7.1 There should only be 5 types of approval/requests** that merchants can submit:Product updates
Store informationSale updates
New MerchantOther
All approval requests should be in survey format for the merchants.

#8. CUSTOMER VIEW FIXES (Website Frontend)

8.1 Merchant Sign-Up: There should be a page where merchants can sign up.
Once submitted, it becomes a request that admins can manually approve.

8.2 Driver Sign-Up: Add a page for driver applications.
It should include all driver info fields (including DOB) and save submissions under a "Driver Info"section in the admin panel.

8.3 Delivery Announcements: There should be a customizable thin moving banner above the purple banner for temporary or
ongoing announcements (e.g. banners).
>>>>>>> 18a30d9 (feat: add product import/export (Shopify CSV support), admin UI, and error handling)
