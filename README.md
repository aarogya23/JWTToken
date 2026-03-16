# JWT Chat Application

This Spring Boot application provides JWT-based authentication with Google OAuth2 integration and real-time chat functionality using WebSocket.

## Features

- User registration and login with JWT tokens
- Google OAuth2 authentication
- Real-time chat with WebSocket/STOMP
- Secure WebSocket connections with JWT authentication
- Dedicated login/registration page with modern UI

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /oauth2/authorization/google` - Google OAuth2 login

### Chat
- WebSocket endpoint: `/ws`
- STOMP destination: `/app/chat.sendMessage`
- STOMP destination: `/app/chat.addUser`
- Subscribe to: `/topic/public`

## Testing the Application

1. **Start the application:**
   ```bash
   ./mvnw spring-boot:run
   ```

2. **Access the login page:**
   - Open: `http://localhost:8080/login.html`

3. **Authentication options:**
   - **Register:** Create a new account with email/password
   - **Login:** Sign in with existing credentials
   - **Google OAuth2:** Click "Continue with Google" (credentials already configured)

4. **Chat functionality:**
   - After login, you'll be redirected to the chat room
   - Send messages to all connected users in real-time
   - User join notifications are displayed
   - Click "Logout" to return to login page

## WebSocket Connection

The WebSocket connection requires JWT authentication:
- Connect to: `ws://localhost:8080/ws?token=YOUR_JWT_TOKEN`
- Use STOMP over SockJS for browser compatibility

## Security

- All WebSocket connections are authenticated using JWT tokens
- Only authenticated users can join the chat
- Messages include sender information and timestamps

## Technologies Used

- Spring Boot 3.3.5
- Spring Security with JWT
- Spring WebSocket with STOMP
- SockJS for browser fallback
- MySQL database
- Google OAuth2