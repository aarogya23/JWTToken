# JWT Chat Application

This Spring Boot application provides JWT-based authentication with Google OAuth2 integration and real-time chat functionality using WebSocket.

## Features

- User registration and login with JWT tokens
- Google OAuth2 authentication
- Real-time chat with WebSocket/STOMP
- Secure WebSocket connections with JWT authentication

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

## Testing the Chat

1. **Start the application**
   ```bash
   ./mvnw spring-boot:run
   ```

2. **Access the chat interface**
   - Open: `http://localhost:8080/chat.html`

3. **Login options:**
   - **Regular login:** Enter email/password and click "Login"
   - **Sign up:** Enter email/password and click "Sign Up"
   - **Google login:** Click "Login with Google"

4. **Start chatting:**
   - After login, you'll be connected to the chat room
   - Type messages and press Enter or click Send
   - Messages are broadcast to all connected users

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