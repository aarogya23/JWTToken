# Next-Gen C2C Marketplace & Delivery Logistics Platform

A comprehensive, full-stack application combining Customer-to-Customer (C2C) e-commerce with real-time gig-economy logistics and modern social engagement features. Built meticulously with **Spring Boot 3** and **React**.

## 🚀 Key Features

### 🛍️ Customer-to-Customer (C2C) Marketplace
- **Seamless Trading:** Users can effortlessly list, discover, and purchase products from one another.
- **Product Management:** Sellers have full control over their inventory and product listings.
- **Order Tracking:** Buyers can view and manage their purchase history with real-time status updates.

### 🚚 Gig-Economy Delivery System
- **3-Way Transaction Model:** Interconnects Sellers, Couriers, and Buyers in a unified logistics network.
- **Courier Dispatch Center:** Dedicated interface for delivery drivers to browse available jobs, accept deliveries, and manage their active routes.
- **Automated Payout Calculations:** Drivers earn competitive delivery fees (e.g., a 15% standardized cut of the product value).

### 📡 Real-Time GPS Tracking
- **Live Telemetry Engine:** Utilizes the browser's Geolocation API to ping location data directly to the server.
- **WebSocket Broadcasting:** Powered by STOMP/SockJS, locations are streamed instantly to buyers.
- **Interactive Maps:** Integration with `react-leaflet` and OpenStreetMap to visually render delivery progress on both the Driver and Buyer sides. 

### 💬 Social & Engagement
- **Facebook-Style Stories:** Users can post and view ephemeral 24-hour stories, boosting platform engagement with a high-end UI carousel.
- **Floating Global Chat widget:** Persistent, messenger-style chat component accessible from any page, ensuring users are always connected.
- **Real-Time Group Chat:** Dedicated group chat rooms leveraging WebSockets for instant, reliable communication.

### 🔐 Security & Identity
- **Robust Authentication:** Secure Email/Password registration and login.
- **Google OAuth2 Integration:** 1-click single sign-on experience.
- **Stateless Sessions:** JWT (JSON Web Token) based API security.
- **Role-Based Access Control:** Distinct boundaries between standard users and delivery personnel.

---

## 🛠️ Tech Stack

### 🖥️ Backend (Java)
- **Framework:** Spring Boot 3.3.x
- **Data Persistence:** Spring Data JPA / Hibernate mapped to **MySQL**
- **Security:** Spring Security, JWT Auth, OAuth2 Resource Server
- **Real-time Engine:** Spring WebSocket, STOMP message broker core

### 📱 Frontend (React)
- **Framework & Build Tools:** React 18, Vite
- **Routing:** React Router DOM (v6)
- **Real-time Clients:** `sockjs-client`, `@stomp/stompjs`
- **Mapping:** `leaflet`, `react-leaflet`
- **UI/UX Aesthetics:** Highly customized Vanilla CSS, modern glassmorphic elements, `lucide-react` iconography

---

## ⚙️ Getting Started

### Prerequisites
- **Java 17+**
- **Node.js 18+**
- **MySQL Server** (running locally or remotely)
- **Maven** (optional, wrapper is included)

### 1. Database Setup
Ensure you have a MySQL server running. Create a schema for the app, or adjust the `application.properties` connection string:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/jwttoken?createDatabaseIfNotExist=true
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

### 2. Google OAuth2 Configuration
Configure your OAuth credentials in `application.properties`:
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
```

### 3. Run the Spring Boot Backend
Navigate to the `JWTToken` root directory where `pom.xml` is located:
```bash
./mvnw spring-boot:run
```
The server will start on `http://localhost:8080`.

### 4. Run the React Frontend
Open a new terminal and navigate to the `client` directory:
```bash
cd client
npm install
npm run dev
```
The application UI will launch (default: `http://localhost:5173`).

---

## 🧪 Testing Workflows
1. **Signup/Login:** Create a standard User account or sign in with Google.
2. **List a Product:** Be a Seller by navigating to `My Products` and creating a listing.
3. **Make a Purchase:** With a separate account, buy the listed item.
4. **Delivery Job:** With a Delivery Driver account, check the Dispatch Center, accept the job, and start "Broadcasting GPS".
5. **Live Tracking:** Login as the buyer and view the interactive Leaflet map to see the delivery driver moving in real-time!
6. **Social:** Check the Groups or post a Story!